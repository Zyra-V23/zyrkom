/// Circle STARK Prover and Verifier for Musical Constraints
/// 
/// Integrates with Stwo framework to generate and verify ZK proofs
/// of musical physics relationships.

use crate::zk::constraints::{ConstraintSystem, MusicalConstraint};
use crate::zk::component::ZyrkomComponent;
use crate::{Result, ZyrkomError};
use stwo::core::fields::m31::M31;
use stwo::core::channel::Blake2sChannel;
use stwo::core::vcs::blake2_merkle::{Blake2sMerkleChannel, Blake2sMerkleHasher};
use stwo::core::pcs::{CommitmentSchemeVerifier, PcsConfig};
use stwo::prover::{prove, CommitmentSchemeProver};
use stwo::core::verifier::verify;
use stwo::core::proof::StarkProof;
use stwo::prover::backend::simd::SimdBackend;
use stwo::core::poly::circle::CanonicCoset;
use stwo::prover::poly::circle::{CircleEvaluation, PolyOps};
use stwo::prover::poly::BitReversedOrder;
use stwo::core::air::Component;
use stwo::prover::ComponentProver;
use serde::{Serialize, Deserialize};

/// A Zero-Knowledge proof of musical physics relationships
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicalProof {
    /// The actual STARK proof from Stwo
    pub stark_proof: StarkProof<Blake2sMerkleHasher>,
    /// Public inputs (constraint coefficients that can be verified)
    pub public_inputs: Vec<u32>,
    /// Metadata about the musical structure being proved
    pub metadata: ProofMetadata,
}

/// Metadata about what the proof validates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofMetadata {
    /// Type of musical structure (interval, chord, scale, etc.)
    pub structure_type: String,
    /// Number of constraints in the proof
    pub constraint_count: usize,
    /// Musical ratios being validated
    pub musical_ratios: Vec<f64>,
    /// Timestamp when proof was generated
    pub timestamp: u64,
}

/// Prover for generating ZK proofs of musical constraints
pub struct ZyrkomProver {
    /// Constraint system to prove
    constraint_system: ConstraintSystem,
}

/// Configuration for the prover
#[derive(Debug, Clone)]
pub struct ProverConfig {
    /// Security level (number of queries)
    pub security_level: usize,
    /// Field size for M31 operations
    pub field_size: usize,
    /// Enable GPU acceleration if available
    pub use_gpu: bool,
}

impl Default for ProverConfig {
    fn default() -> Self {
        Self {
            security_level: 80,  // 80-bit security
            field_size: 31,      // M31 field
            use_gpu: false,      // CPU by default
        }
    }
}

impl ZyrkomProver {
    /// Create a new prover for a constraint system
    pub fn new(constraint_system: ConstraintSystem) -> Result<Self> {
        constraint_system.validate()?;
        
        Ok(Self {
            constraint_system,
        })
    }



    /// Generate a ZK proof for the musical constraints using real Stwo
    pub fn prove(&self) -> Result<MusicalProof> {
        // Create Zyrkom component from constraint system
        let component = ZyrkomComponent::new(self.constraint_system.clone())?;
        let components: Vec<&dyn ComponentProver<SimdBackend>> = vec![&component];
        
        // Setup Stwo configuration
        let config = PcsConfig::default();
        let log_n_rows = component.max_constraint_log_degree_bound() - 2; // 8 -> 256 rows
        
        // FIXED: Proper twiddle calculation following Stwo examples
        // Most examples use: log_size + blowup_factor + 1
        // For constraint evaluation, we need even more twiddles
        let twiddle_log_size = log_n_rows + config.fri_config.log_blowup_factor + 2; // Extra +1 for safety
        let twiddles = SimdBackend::precompute_twiddles(
            CanonicCoset::new(twiddle_log_size)
                .circle_domain()
                .half_coset,
        );
        
        // Setup channel and commitment scheme
        let channel = &mut Blake2sChannel::default();
        let mut commitment_scheme = 
            CommitmentSchemeProver::<_, Blake2sMerkleChannel>::new(config, &twiddles);
        
        // Commit empty preprocessed trace (no preprocessed data for musical constraints)
        let tree_builder = commitment_scheme.tree_builder();
        tree_builder.commit(channel);
        
        // Generate and commit main trace with musical constraint data
        // THIS must match exactly what trace_log_degree_bounds() expects
        let trace = self.generate_trace(&component, log_n_rows)?;
        let mut tree_builder = commitment_scheme.tree_builder();
        tree_builder.extend_evals(trace);
        tree_builder.commit(channel);
        
        // Generate real STARK proof using Stwo
        let stark_proof = prove(&components, channel, commitment_scheme)
            .map_err(|e| ZyrkomError::ProofError {
                reason: format!("Stwo proof generation failed: {:?}", e),
            })?;
        
        // Generate public inputs and metadata
        let public_inputs = self.extract_public_inputs();
        let metadata = ProofMetadata {
            structure_type: self.infer_structure_type(),
            constraint_count: self.constraint_system.constraint_count(),
            musical_ratios: self.extract_musical_ratios(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        Ok(MusicalProof {
            stark_proof,
            public_inputs,
            metadata,
        })
    }



    /// Generate witness values (private inputs to the proof)
    #[allow(dead_code)]
    fn generate_witness(&self) -> Result<Vec<M31>> {
        let mut witness = Vec::new();
        
        // For each constraint, generate the private witness values
        for constraint in &self.constraint_system.constraints {
            // The witness includes the actual ratio values and intermediate calculations
            witness.push(constraint.ratio_m31);
            witness.push(constraint.coefficient);
            
            // Add intermediate values for constraint verification
            let intermediate = self.calculate_constraint_intermediate(constraint);
            witness.push(intermediate);
        }
        
        Ok(witness)
    }

    /// Calculate intermediate values for constraint verification
    fn calculate_constraint_intermediate(&self, constraint: &MusicalConstraint) -> M31 {
        // For harmonic ratio constraints, intermediate is the harmonic error
        match constraint.constraint_type {
            crate::zk::constraints::ConstraintType::HarmonicRatio => {
                // Calculate how close the ratio is to the nearest harmonic ratio
                let harmonic_error = self.calculate_harmonic_error(constraint.ratio_f64);
                M31::from_u32_unchecked((harmonic_error * 1000000.0) as u32)
            }
            crate::zk::constraints::ConstraintType::OctaveEquivalence => {
                // For octave, intermediate is the deviation from 2.0
                let deviation = (constraint.ratio_f64 - 2.0).abs();
                M31::from_u32_unchecked((deviation * 1000000.0) as u32)
            }
            _ => {
                // Default intermediate value
                M31::from_u32_unchecked(1)
            }
        }
    }

    /// Calculate harmonic error for a ratio
    fn calculate_harmonic_error(&self, ratio: f64) -> f64 {
        let harmonic_ratios = [1.0, 2.0, 1.5, 4.0/3.0, 1.25, 6.0/5.0];
        harmonic_ratios.iter()
            .map(|&h| (ratio - h).abs())
            .fold(f64::INFINITY, f64::min)
    }

    /// Extract public inputs from constraints
    fn extract_public_inputs(&self) -> Vec<u32> {
        let mut public_inputs = Vec::new();
        
        // Add constraint count
        public_inputs.push(self.constraint_system.constraint_count() as u32);
        
        // Add constraint type indicators
        for constraint in &self.constraint_system.constraints {
            let type_id = match constraint.constraint_type {
                crate::zk::constraints::ConstraintType::HarmonicRatio => 1,
                crate::zk::constraints::ConstraintType::OctaveEquivalence => 2,
                crate::zk::constraints::ConstraintType::Consonance => 3,
                crate::zk::constraints::ConstraintType::IntervalSum => 4,
                crate::zk::constraints::ConstraintType::TuningConsistency => 5,
            };
            public_inputs.push(type_id);
        }
        
        public_inputs
    }



    /// Validate a single constraint
    #[allow(dead_code)]
    fn validate_constraint(&self, constraint: &MusicalConstraint) -> bool {
        match constraint.constraint_type {
            crate::zk::constraints::ConstraintType::HarmonicRatio => {
                // Check if ratio is close to a harmonic ratio
                self.calculate_harmonic_error(constraint.ratio_f64) < 0.01
            }
            crate::zk::constraints::ConstraintType::OctaveEquivalence => {
                // Check if ratio is close to 2.0
                (constraint.ratio_f64 - 2.0).abs() < 0.001
            }
            crate::zk::constraints::ConstraintType::Consonance => {
                // Check if ratio is consonant
                let consonant_ratios = [2.0, 1.5, 4.0/3.0, 1.25, 6.0/5.0];
                consonant_ratios.iter().any(|&r| (constraint.ratio_f64 - r).abs() < 0.01)
            }
            _ => true, // Other constraints always valid for now
        }
    }

    /// Infer the type of musical structure being proved
    fn infer_structure_type(&self) -> String {
        match self.constraint_system.constraint_count() {
            1 => "Interval".to_string(),
            2..=5 => "Chord".to_string(),
            6..=12 => "Scale".to_string(),
            _ => "Complex".to_string(),
        }
    }

    /// Extract musical ratios for metadata
    fn extract_musical_ratios(&self) -> Vec<f64> {
        self.constraint_system.constraints
            .iter()
            .map(|c| c.ratio_f64)
            .collect()
    }
    
    /// Generate trace data for Stwo from musical constraints
    /// CRITICAL: Must generate exactly the same number of columns as trace_log_degree_bounds()
    fn generate_trace(
        &self, 
        component: &ZyrkomComponent, 
        log_n_rows: u32
    ) -> Result<Vec<CircleEvaluation<SimdBackend, M31, BitReversedOrder>>> {
        use stwo::prover::backend::simd::column::BaseColumn;
        use stwo::prover::backend::Column;
        
        let n_rows = 1 << log_n_rows;
        let n_constraints = component.constraint_system.constraint_count();
        
        // CRITICAL: Generate exactly n_constraints columns (one per constraint)
        // This must match trace_log_degree_bounds() which returns n_constraints columns
        let mut trace_cols = Vec::with_capacity(n_constraints);
        
        for constraint in &component.constraint_system.constraints {
            // Create one column per constraint with the ratio value
            let mut constraint_col = BaseColumn::zeros(n_rows);
            constraint_col.set(0, constraint.ratio_m31);
            
            // Fill remaining rows with zeros (or could be other constraint-related values)
            // For basic musical constraints, the first row is sufficient
            for row in 1..n_rows {
                constraint_col.set(row, M31::from_u32_unchecked(0));
            }
            
            // Convert to CircleEvaluation (required by Stwo)
            let domain = CanonicCoset::new(log_n_rows).circle_domain();
            
            trace_cols.push(CircleEvaluation::<SimdBackend, M31, BitReversedOrder>::new(
                domain, constraint_col
            ));
        }
        
        // Verify we generated the correct number of columns
        assert_eq!(trace_cols.len(), n_constraints, 
            "Generated {} columns but component expects {} constraints", 
            trace_cols.len(), n_constraints);
        
        Ok(trace_cols)
    }
}

/// Verifier for ZK proofs of musical constraints
pub struct ZyrkomVerifier {
    /// The ORIGINAL constraint system used for proving (trusted source)
    trusted_constraint_system: ConstraintSystem,
    /// The ORIGINAL component used for proving  
    trusted_component: ZyrkomComponent,
    /// Configuration for verification (reserved for future use)
    _config: VerifierConfig,
}

/// Configuration for the verifier
#[derive(Debug, Clone)]
pub struct VerifierConfig {
    /// Maximum allowed proof size
    pub max_proof_size: usize,
    /// Timeout for verification (seconds)
    pub timeout_seconds: u64,
}

impl Default for VerifierConfig {
    fn default() -> Self {
        Self {
            max_proof_size: 10 * 1024 * 1024, // 10MB
            timeout_seconds: 30,
        }
    }
}

impl ZyrkomVerifier {
    /// Create a new verifier with TRUSTED constraint system and component
    /// This must be the SAME constraint system used for proving
    pub fn new(constraint_system: ConstraintSystem) -> Result<Self> {
        constraint_system.validate()?;
        let component = ZyrkomComponent::new(constraint_system.clone())?;
        
        Ok(Self {
            trusted_constraint_system: constraint_system,
            trusted_component: component,
            _config: VerifierConfig::default(),
        })
    }

    /// Create verifier with custom configuration
    pub fn with_config(constraint_system: ConstraintSystem, config: VerifierConfig) -> Result<Self> {
        constraint_system.validate()?;
        let component = ZyrkomComponent::new(constraint_system.clone())?;
        
        Ok(Self {
            trusted_constraint_system: constraint_system,
            trusted_component: component,
            _config: config,
        })
    }

    /// Verify a musical proof using proper Stwo verification following official patterns
    pub fn verify(&self, proof: &MusicalProof) -> Result<bool> {
        // Step 1: Validate proof claims against TRUSTED constraints (not proof's own claims)
        self.validate_proof_claims(proof)?;
        
        // Step 2: Set up proper Stwo verification following documentation patterns
        self.verify_stark_proof(proof)
    }
    
    /// Validate that proof's claims match our TRUSTED constraint system
    fn validate_proof_claims(&self, proof: &MusicalProof) -> Result<()> {
        // Validate constraint count matches
        if proof.metadata.constraint_count != self.trusted_constraint_system.constraint_count() {
            return Err(ZyrkomError::ProofError {
                reason: format!(
                    "Constraint count mismatch: proof claims {} but trusted system has {}",
                    proof.metadata.constraint_count,
                    self.trusted_constraint_system.constraint_count()
                ),
            });
        }
        
        // Validate musical ratios match trusted constraints  
        let trusted_ratios: Vec<f64> = self.trusted_constraint_system.constraints
            .iter()
            .map(|c| c.ratio_f64)
            .collect();
            
        if proof.metadata.musical_ratios.len() != trusted_ratios.len() {
            return Err(ZyrkomError::ProofError {
                reason: "Musical ratio count mismatch between proof and trusted constraints".to_string(),
            });
        }
        
        // Validate each ratio matches (with small tolerance for floating point)
        for (i, (&proof_ratio, &trusted_ratio)) in proof.metadata.musical_ratios
            .iter()
            .zip(trusted_ratios.iter())
            .enumerate() {
            if (proof_ratio - trusted_ratio).abs() > 0.001 {
                return Err(ZyrkomError::ProofError {
                    reason: format!(
                        "Musical ratio mismatch at index {}: proof has {} but trusted system has {}",
                        i, proof_ratio, trusted_ratio
                    ),
                });
            }
        }
        
        // Validate public inputs represent constraint types correctly
        self.validate_public_inputs(proof)?;
        
        Ok(())
    }
    
    /// Validate public inputs correctly represent the trusted constraint system
    fn validate_public_inputs(&self, proof: &MusicalProof) -> Result<()> {
        if proof.public_inputs.is_empty() {
            return Err(ZyrkomError::ProofError {
                reason: "Proof has no public inputs".to_string(),
            });
        }
        
        // First public input should be constraint count
        if proof.public_inputs[0] as usize != self.trusted_constraint_system.constraint_count() {
            return Err(ZyrkomError::ProofError {
                reason: "Public input constraint count doesn't match trusted system".to_string(),
            });
        }
        
        // Validate constraint type encoding matches trusted system
        for (i, constraint) in self.trusted_constraint_system.constraints.iter().enumerate() {
            let expected_type_id = match constraint.constraint_type {
                crate::zk::constraints::ConstraintType::HarmonicRatio => 1,
                crate::zk::constraints::ConstraintType::OctaveEquivalence => 2,
                crate::zk::constraints::ConstraintType::Consonance => 3,
                crate::zk::constraints::ConstraintType::IntervalSum => 4,
                crate::zk::constraints::ConstraintType::TuningConsistency => 5,
            };
            
            if let Some(&actual_type_id) = proof.public_inputs.get(i + 1) {
                if actual_type_id != expected_type_id {
                    return Err(ZyrkomError::ProofError {
                        reason: format!(
                            "Constraint type mismatch at index {}: proof has {} but trusted system expects {}",
                            i, actual_type_id, expected_type_id
                        ),
                    });
        }
            } else {
                return Err(ZyrkomError::ProofError {
                    reason: format!("Missing public input for constraint type at index {}", i),
                });
            }
        }
        
        Ok(())
    }
    
    /// Verify STARK proof using proper Stwo patterns from documentation
    fn verify_stark_proof(&self, proof: &MusicalProof) -> Result<bool> {
        // Create channel and commitment scheme following documentation pattern
        let channel = &mut Blake2sChannel::default();
        let config = PcsConfig::default();
        let mut commitment_scheme = CommitmentSchemeVerifier::<Blake2sMerkleChannel>::new(config);
        
        // CRITICAL: Configure the verifier with the proof commitments following Plonk example
        // Get the expected column sizes from our TRUSTED component
        let sizes = self.trusted_component.trace_log_degree_bounds();
        
        // Commit each tree with its corresponding hash and sizes
        // Tree 0: Preprocessed (empty in our case)
        commitment_scheme.commit(proof.stark_proof.commitments[0], &sizes[0], channel);
        
        // Tree 1: Main trace (our musical constraints)
        commitment_scheme.commit(proof.stark_proof.commitments[1], &sizes[1], channel);
        
        // Note: Tree 2 would be composition polynomial, handled internally by verify()
        
        // Use TRUSTED component (not recreated from proof metadata)
        let components: Vec<&dyn Component> = vec![&self.trusted_component];
        
        // Verify using Stwo's verify function with properly configured verifier
        match verify(&components, channel, &mut commitment_scheme, proof.stark_proof.clone()) {
            Ok(()) => Ok(true),
            Err(e) => Err(ZyrkomError::ProofError {
                reason: format!("Stwo STARK verification failed: {:?}", e),
            }),
        }
    }
}



#[cfg(test)]
mod tests {
    use super::*;
    use crate::musical::MusicalInterval;
    use crate::zk::constraints::ToConstraints;

    #[test]
    fn test_prover_creation() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        let prover = ZyrkomProver::new(constraints).unwrap();
        assert_eq!(prover.constraint_system.constraint_count(), 2);
    }

    #[test]
    fn test_proof_generation() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        let prover = ZyrkomProver::new(constraints).unwrap();
        let proof = prover.prove().unwrap();
        
        assert!(proof.stark_proof.size_estimate() > 0);
        assert!(!proof.public_inputs.is_empty());
        assert_eq!(proof.metadata.structure_type, "Chord");
    }

    #[test]
    fn test_proof_verification() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        
        println!("DEBUG: Constraint system has {} constraints", constraints.constraint_count());
        println!("DEBUG: Component will report {} constraints", constraints.constraint_count());
        
        let component = ZyrkomComponent::new(constraints.clone()).unwrap();
        println!("DEBUG: Component n_constraints() = {}", component.n_constraints());
        println!("DEBUG: Component trace bounds = {:?}", component.trace_log_degree_bounds());
        
        let prover = ZyrkomProver::new(constraints.clone()).unwrap();
        let proof = prover.prove().unwrap();
        
        let verifier = ZyrkomVerifier::new(constraints).unwrap();
        let is_valid = verifier.verify(&proof).unwrap();
        assert!(is_valid);
    }

    #[test]
    fn test_invalid_proof_rejection() {
        // Test 1: Verify with completely different constraint system
        {
            let fifth = MusicalInterval::perfect_fifth();
            let constraints = fifth.to_constraints().unwrap();
            
            let prover = ZyrkomProver::new(constraints).unwrap();
            let proof = prover.prove().unwrap();
            
            // Create verifier with different constraint system (major third instead of fifth)
            let third = MusicalInterval::major_third();
            let wrong_constraints = third.to_constraints().unwrap();
            let wrong_verifier = ZyrkomVerifier::new(wrong_constraints).unwrap();
            
            // This should fail because constraint systems don't match
            match wrong_verifier.verify(&proof) {
                Ok(false) => {
                    // Expected: verification returns false
                    println!("✅ Correctly rejected proof with wrong constraints");
                }
                Err(e) => {
                    // Also acceptable: verification errors due to mismatch
                    println!("✅ Correctly errored with wrong constraints: {}", e);
                    assert!(e.to_string().contains("mismatch") || 
                            e.to_string().contains("failed") ||
                            e.to_string().contains("invalid"));
                }
                Ok(true) => {
                    panic!("❌ SECURITY FAILURE: Verification should not pass with wrong constraints!");
                }
            }
        }
        
        // Test 2: Verify with constraint system that has different count
        {
            let fifth = MusicalInterval::perfect_fifth();
            let constraints = fifth.to_constraints().unwrap();
            
            let prover = ZyrkomProver::new(constraints.clone()).unwrap();
            let proof = prover.prove().unwrap();
            
            // Create constraint system with different number of constraints
            let octave = MusicalInterval::octave();
            let different_constraints = octave.to_constraints().unwrap();
            
            // Verify they actually have different counts
            assert_ne!(constraints.constraint_count(), different_constraints.constraint_count());
            
            let mismatched_verifier = ZyrkomVerifier::new(different_constraints).unwrap();
            
            // This should fail due to constraint count mismatch
            let result = mismatched_verifier.verify(&proof);
            assert!(result.is_err() || (result.is_ok() && result.unwrap() == false), 
                "Verification should fail with mismatched constraint count");
        }
        
        // Test 3: Ensure valid proof still passes (sanity check)
        {
            let fifth = MusicalInterval::perfect_fifth();
            let constraints = fifth.to_constraints().unwrap();
            
            let prover = ZyrkomProver::new(constraints.clone()).unwrap();
            let proof = prover.prove().unwrap();
            
            let correct_verifier = ZyrkomVerifier::new(constraints).unwrap();
            let result = correct_verifier.verify(&proof).unwrap();
            assert!(result, "Valid proof with correct constraints should always pass");
        }
    }
} 