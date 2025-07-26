/// Zyrkom Component for Circle STARK following official Stwo patterns
/// 
/// Based on stwo/crates/constraint-framework/src/component.rs and examples

use crate::zk::constraints::{ConstraintSystem};
use crate::Result;
use stwo::core::air::Component;
use stwo::core::vcs::blake2_merkle::Blake2sMerkleChannel;
use stwo::core::fields::qm31::SecureField;
use stwo::core::poly::circle::CanonicCoset;
use stwo::prover::backend::BackendForChannel;
use stwo::prover::{ComponentProver, Trace, DomainEvaluationAccumulator};

/// Musical STARK Component for proving harmonic relationships
/// Based on Circle STARK protocol for M31 field efficiency
pub struct ZyrkomComponent {
    /// The constraint system containing musical physics constraints for ZK proofs
    pub constraint_system: ConstraintSystem,
}

impl ZyrkomComponent {
    /// Creates a new ZyrkomComponent with the given constraint system
    /// 
    /// # Arguments
    /// * `constraint_system` - Musical physics constraints to be proven
    /// 
    /// # Returns
    /// * `Result<Self>` - A new component instance or error
    pub fn new(constraint_system: ConstraintSystem) -> Result<Self> {
        Ok(Self { constraint_system })
    }
}

/// Component trait implementation - defines the constraint structure
impl Component for ZyrkomComponent {
    fn n_constraints(&self) -> usize {
        self.constraint_system.constraint_count()
    }

    fn max_constraint_log_degree_bound(&self) -> u32 {
        // Musical constraints are typically low degree (quadratic at most)
        // For our perfect fifth constraints, degree bound of 2^10 = 1024 should be sufficient
        10
    }

    fn trace_log_degree_bounds(&self) -> stwo::core::pcs::TreeVec<stwo::core::ColumnVec<u32>> {
        // FIXED: Match the actual tree structure we create in generate_trace()
        // Tree 0: Preprocessed (empty for us)
        // Tree 1: Our main trace with N columns (one per constraint)
        let n_constraints = self.constraint_system.constraint_count();
        let log_degree = self.max_constraint_log_degree_bound() - 2; // 8 for our use case
        
        // Create TreeVec with:
        // - Tree 0: Empty (preprocessed)
        // - Tree 1: N columns (our constraints)
        let preprocessed_tree: Vec<u32> = vec![]; // Empty preprocessed
        let main_tree: Vec<u32> = (0..n_constraints).map(|_| log_degree).collect();
        
        stwo::core::pcs::TreeVec::new(vec![preprocessed_tree, main_tree])
    }

    fn mask_points(
        &self,
        point: stwo::core::circle::CirclePoint<stwo::core::fields::qm31::SecureField>,
    ) -> stwo::core::pcs::TreeVec<stwo::core::ColumnVec<Vec<stwo::core::circle::CirclePoint<stwo::core::fields::qm31::SecureField>>>> {
        // FIXED: Match the actual tree structure
        // Tree 0: Empty (preprocessed)
        // Tree 1: N mask points (one per constraint column)
        let n_constraints = self.constraint_system.constraint_count();
        
        let preprocessed_masks: Vec<Vec<stwo::core::circle::CirclePoint<stwo::core::fields::qm31::SecureField>>> = vec![]; // Empty preprocessed
        let main_masks: Vec<Vec<stwo::core::circle::CirclePoint<stwo::core::fields::qm31::SecureField>>> = 
            (0..n_constraints).map(|_| vec![point]).collect();
        
        stwo::core::pcs::TreeVec::new(vec![preprocessed_masks, main_masks])
    }

    fn preproccessed_column_indices(&self) -> stwo::core::ColumnVec<usize> {
        // No preprocessed columns for basic musical constraints
        vec![]
    }

    fn evaluate_constraint_quotients_at_point(
        &self,
        _point: stwo::core::circle::CirclePoint<stwo::core::fields::qm31::SecureField>,
        _mask: &stwo::core::pcs::TreeVec<stwo::core::ColumnVec<Vec<stwo::core::fields::qm31::SecureField>>>,
        evaluation_accumulator: &mut stwo::core::air::accumulation::PointEvaluationAccumulator,
    ) {
        // Evaluate each musical constraint at the given point
        for (_i, constraint) in self.constraint_system.constraints.iter().enumerate() {
            // Musical constraint: ratio_m31 - coefficient should equal zero for valid harmonies
            let constraint_value = constraint.ratio_m31 - constraint.coefficient;
            
            // Convert M31 to SecureField - M31 is the base field, SecureField is the extension
            let secure_value = SecureField::from(constraint_value);
            evaluation_accumulator.accumulate(secure_value);
        }
    }
}

/// Implementation of ComponentProver trait for ZyrkomComponent
impl<B: BackendForChannel<Blake2sMerkleChannel>> ComponentProver<B> for ZyrkomComponent {
    fn evaluate_constraint_quotients_on_domain(
        &self,
        _trace: &Trace<'_, B>,
        evaluation_accumulator: &mut DomainEvaluationAccumulator<B>,
    ) {
        if self.constraint_system.constraint_count() == 0 {
            return;
        }

        // Get the evaluation domain for our constraints
        let eval_domain = CanonicCoset::new(
            self.max_constraint_log_degree_bound()
        ).circle_domain();
        
        // Get accumulator column for our constraints - following EXACT Stwo pattern
        let [mut accum] = evaluation_accumulator.columns([(
            eval_domain.log_size(), 
            self.constraint_system.constraint_count()
        )]);
        
        // EXACT pattern from stwo/crates/constraint-framework/src/prover/component_prover.rs:171
        accum.random_coeff_powers.reverse();
        
        // For each domain point, compute constraint evaluations
        for row in 0..eval_domain.size() {
            let mut row_evaluation = SecureField::from_u32_unchecked(0, 0, 0, 0);
            
            // Evaluate each musical constraint and accumulate with random coefficients
            for (constraint_idx, constraint) in self.constraint_system.constraints.iter().enumerate() {
                // Musical constraint: check if the ratio is preserved
                // This should evaluate to zero for valid musical relationships
                let constraint_value = constraint.ratio_m31 - constraint.coefficient;
                
                // Use the random coefficient for this constraint
                if constraint_idx < accum.random_coeff_powers.len() {
                    let random_coeff = accum.random_coeff_powers[constraint_idx];
                    // Convert M31 to SecureField and multiply by coefficient
                    row_evaluation += random_coeff * SecureField::from(constraint_value);
                }
            }
            
            // Set the evaluation result using the EXACT Stwo pattern: col.at() + new_value
            let current_value = accum.col.at(row);
            accum.col.set(row, current_value + row_evaluation);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::musical::MusicalInterval;
    use crate::zk::constraints::ToConstraints;

    #[test]
    fn test_zyrkom_component_creation() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        let component = ZyrkomComponent::new(constraints).unwrap();
        
        assert!(component.n_constraints() > 0);
        assert!(component.max_constraint_log_degree_bound() > 0);
    }

    #[test]
    fn test_component_trace_bounds() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        let component = ZyrkomComponent::new(constraints).unwrap();
        
        let bounds = component.trace_log_degree_bounds();
        assert!(!bounds.is_empty());
        
        // Tree 0: Preprocessed (should be empty for musical constraints)
        assert!(bounds[0].is_empty());
        
        // Tree 1: Main trace (should contain our constraints)  
        assert!(!bounds[1].is_empty());
        assert_eq!(bounds[1].len(), 2); // Perfect fifth generates 2 constraints
    }

    #[test]
    fn test_mask_points_generation() {
        let fifth = MusicalInterval::perfect_fifth();
        let constraints = fifth.to_constraints().unwrap();
        let component = ZyrkomComponent::new(constraints).unwrap();
        
        let point = stwo::core::circle::CirclePoint::zero(); // Zero point for mathematical evaluation
        let mask_points = component.mask_points(point);
        assert!(!mask_points.is_empty());
    }
} 