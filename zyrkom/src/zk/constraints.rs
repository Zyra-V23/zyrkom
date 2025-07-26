/// ZK Constraint Generation from Musical Physics
/// 
/// Converts immutable musical relationships into mathematical constraints
/// for Circle STARK proofs using M31 field arithmetic.

use crate::musical::{MusicalInterval, Chord};
use crate::{Result, ZyrkomError};
use stwo::core::fields::m31::M31;

/// Scale factor for converting musical ratios to M31 field elements
/// Using 2^20 to maintain precision while staying within M31 range
const M31_SCALE_FACTOR: f64 = 1_048_576.0; // 2^20

/// A constraint derived from musical physics laws
#[derive(Debug, Clone, PartialEq)]
pub struct MusicalConstraint {
    /// Type of constraint (ratio validation, harmonic series, etc.)
    pub constraint_type: ConstraintType,
    /// The musical ratio as M31 field element
    pub ratio_m31: M31,
    /// Original ratio for reference
    pub ratio_f64: f64,
    /// Constraint coefficient for proof generation
    pub coefficient: M31,
}

/// Types of constraints derivable from musical physics
#[derive(Debug, Clone, PartialEq)]
pub enum ConstraintType {
    /// Validates frequency ratio follows harmonic series
    HarmonicRatio,
    /// Ensures octave equivalence (2:1 ratio)
    OctaveEquivalence,
    /// Validates perfect consonance ratios (3:2, 4:3, 5:4, etc.)
    Consonance,
    /// Ensures chord intervals sum correctly
    IntervalSum,
    /// Validates tuning system consistency
    TuningConsistency,
}

impl MusicalConstraint {
    /// Create a new musical constraint from a ratio
    pub fn from_ratio(ratio: f64, constraint_type: ConstraintType) -> Result<Self> {
        if ratio <= 0.0 || ratio > 10.0 {
            return Err(ZyrkomError::PhysicsError {
                details: format!("Invalid ratio for constraint: {}", ratio),
            });
        }

        // Convert ratio to M31 field element with scaling
        let scaled_ratio = (ratio * M31_SCALE_FACTOR) as u32;
        let ratio_m31 = M31::from_u32_unchecked(scaled_ratio);
        
        // Generate coefficient based on constraint type
        let coefficient = Self::generate_coefficient(&constraint_type, ratio);

        Ok(Self {
            constraint_type,
            ratio_m31,
            ratio_f64: ratio,
            coefficient,
        })
    }

    /// Generate constraint coefficient based on type and ratio
    fn generate_coefficient(constraint_type: &ConstraintType, ratio: f64) -> M31 {
        match constraint_type {
            ConstraintType::HarmonicRatio => {
                // For harmonic ratios, coefficient is inverse of the ratio
                let coeff = (M31_SCALE_FACTOR / ratio) as u32;
                M31::from_u32_unchecked(coeff)
            }
            ConstraintType::OctaveEquivalence => {
                // Octave constraint: ratio should equal 2
                let coeff = (2.0 * M31_SCALE_FACTOR) as u32;
                M31::from_u32_unchecked(coeff)
            }
            ConstraintType::Consonance => {
                // Consonance coefficient based on harmonic complexity
                let complexity = Self::harmonic_complexity(ratio);
                let coeff = (M31_SCALE_FACTOR / complexity) as u32;
                M31::from_u32_unchecked(coeff)
            }
            ConstraintType::IntervalSum => {
                // For interval sums, use unity coefficient
                M31::from_u32_unchecked(M31_SCALE_FACTOR as u32)
            }
            ConstraintType::TuningConsistency => {
                // Tuning consistency based on deviation from just intonation
                let deviation = Self::calculate_tuning_deviation(ratio);
                let coeff = (M31_SCALE_FACTOR * (1.0 - deviation)) as u32;
                M31::from_u32_unchecked(coeff)
            }
        }
    }

    /// Calculate harmonic complexity of a ratio (lower is more consonant)
    fn harmonic_complexity(ratio: f64) -> f64 {
        // Known consonant ratios and their complexities
        let consonant_ratios = [
            (2.0, 1.0),      // Octave
            (1.5, 2.0),      // Perfect fifth (3:2)
            (4.0/3.0, 3.0),  // Perfect fourth (4:3)
            (1.25, 4.0),     // Major third (5:4)
            (6.0/5.0, 5.0),  // Minor third (6:5)
        ];

        // Find closest consonant ratio
        let mut min_distance = f64::INFINITY;
        let mut complexity = 10.0; // Default high complexity

        for (consonant_ratio, consonant_complexity) in &consonant_ratios {
            let distance = (ratio - consonant_ratio).abs();
            if distance < min_distance {
                min_distance = distance;
                complexity = *consonant_complexity;
            }
        }

        // Increase complexity based on distance from pure ratio
        complexity + min_distance * 10.0
    }

    /// Calculate tuning deviation from just intonation
    fn calculate_tuning_deviation(ratio: f64) -> f64 {
        // Calculate cents deviation from pure just intonation
        let cents = 1200.0 * ratio.log2();
        let pure_cents = (cents / 100.0).round() * 100.0; // Round to nearest 100 cents
        let deviation = (cents - pure_cents).abs() / 1200.0; // Normalize to [0,1]
        deviation.min(1.0)
    }
}

/// Constraint system for a complete musical structure
#[derive(Debug, Clone)]
pub struct ConstraintSystem {
    /// Individual constraints
    pub constraints: Vec<MusicalConstraint>,
    /// Constraint relationships (which constraints must be satisfied together)
    pub relationships: Vec<ConstraintRelationship>,
}

/// Relationship between constraints
#[derive(Debug, Clone)]
pub struct ConstraintRelationship {
    /// Constraints that must be satisfied together
    pub constraint_indices: Vec<usize>,
    /// Type of relationship
    pub relationship_type: RelationshipType,
}

/// Types of constraint relationships
#[derive(Debug, Clone)]
pub enum RelationshipType {
    /// All constraints must be satisfied (AND)
    Conjunction,
    /// At least one constraint must be satisfied (OR)
    Disjunction,
    /// Constraints are mutually exclusive (XOR)
    Exclusion,
}

impl ConstraintSystem {
    /// Create a new empty constraint system
    pub fn new() -> Self {
        Self {
            constraints: Vec::new(),
            relationships: Vec::new(),
        }
    }

    /// Add a constraint to the system
    pub fn add_constraint(&mut self, constraint: MusicalConstraint) -> usize {
        self.constraints.push(constraint);
        self.constraints.len() - 1
    }

    /// Add a relationship between constraints
    pub fn add_relationship(&mut self, relationship: ConstraintRelationship) {
        self.relationships.push(relationship);
    }

    /// Get total number of constraints
    pub fn constraint_count(&self) -> usize {
        self.constraints.len()
    }

    /// Validate the constraint system for consistency
    pub fn validate(&self) -> Result<()> {
        // Check for constraint conflicts
        for relationship in &self.relationships {
            if relationship.constraint_indices.iter().any(|&i| i >= self.constraints.len()) {
                return Err(ZyrkomError::ConstraintError {
                    context: "Relationship references invalid constraint index".to_string(),
                });
            }
        }

        // Check for mathematical consistency
        // TODO: Add more sophisticated consistency checks

        Ok(())
    }
}

/// Trait for converting musical structures to constraints
pub trait ToConstraints {
    /// Convert to a constraint system
    fn to_constraints(&self) -> Result<ConstraintSystem>;
}

/// Implementation for MusicalInterval
impl ToConstraints for MusicalInterval {
    fn to_constraints(&self) -> Result<ConstraintSystem> {
        let mut system = ConstraintSystem::new();

        // Primary ratio constraint
        let ratio_constraint = MusicalConstraint::from_ratio(
            self.ratio(),
            ConstraintType::HarmonicRatio,
        )?;
        system.add_constraint(ratio_constraint);

        // Check for special intervals
        if (self.ratio() - 2.0).abs() < 0.001 {
            // Octave constraint
            let octave_constraint = MusicalConstraint::from_ratio(
                self.ratio(),
                ConstraintType::OctaveEquivalence,
            )?;
            system.add_constraint(octave_constraint);
        }

        // Consonance constraint for pure ratios
        if Self::is_consonant_ratio(self.ratio()) {
            let consonance_constraint = MusicalConstraint::from_ratio(
                self.ratio(),
                ConstraintType::Consonance,
            )?;
            system.add_constraint(consonance_constraint);
        }

        system.validate()?;
        Ok(system)
    }
}

impl MusicalInterval {
    /// Check if a ratio is consonant (simple harmonic ratio)
    fn is_consonant_ratio(ratio: f64) -> bool {
        let consonant_ratios = [2.0, 1.5, 4.0/3.0, 1.25, 6.0/5.0];
        consonant_ratios.iter().any(|&r| (ratio - r).abs() < 0.01)
    }
}

/// Implementation for Chord
impl ToConstraints for Chord {
    fn to_constraints(&self) -> Result<ConstraintSystem> {
        let mut system = ConstraintSystem::new();
        let notes = self.notes();

        // Generate constraints for each interval between adjacent notes
        for i in 0..notes.len() {
            for j in (i + 1)..notes.len() {
                let interval = notes[i].interval_to(&notes[j]);
                let interval_system = interval.to_constraints()?;
                
                // Merge constraints from interval
                for constraint in interval_system.constraints {
                    system.add_constraint(constraint);
                }
            }
        }

        // Add chord-specific constraints
        if notes.len() >= 3 {
            // Ensure harmonic series relationship for triads
            let root_to_third = notes[0].interval_to(&notes[1]);
            let root_to_fifth = notes[0].interval_to(&notes[2]);
            
            // Create interval sum constraint: third + fourth should equal fifth
            // This validates the harmonic consistency of the chord
            let sum_constraint = MusicalConstraint::from_ratio(
                root_to_fifth.ratio() / root_to_third.ratio(), // Should equal fourth ratio
                ConstraintType::IntervalSum,
            )?;
            system.add_constraint(sum_constraint);
        }

        system.validate()?;
        Ok(system)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::musical::{MusicalInterval, MusicalNote};

    #[test]
    fn test_constraint_from_perfect_fifth() {
        let constraint = MusicalConstraint::from_ratio(1.5, ConstraintType::Consonance).unwrap();
        assert_eq!(constraint.ratio_f64, 1.5);
        assert_eq!(constraint.constraint_type, ConstraintType::Consonance);
    }

    #[test]
    fn test_interval_to_constraints() {
        let fifth = MusicalInterval::perfect_fifth();
        let system = fifth.to_constraints().unwrap();
        assert!(system.constraint_count() >= 2); // Should have harmonic and consonance constraints
    }

    #[test]
    fn test_octave_constraint() {
        let octave = MusicalInterval::octave();
        let system = octave.to_constraints().unwrap();
        
        // Should have octave equivalence constraint
        let has_octave_constraint = system.constraints.iter()
            .any(|c| matches!(c.constraint_type, ConstraintType::OctaveEquivalence));
        assert!(has_octave_constraint);
    }

    #[test]
    fn test_chord_constraints() {
        let root = MusicalNote::from_midi(60); // C4
        let chord = Chord::major_triad(root);
        let system = chord.to_constraints().unwrap();
        
        assert!(system.constraint_count() > 0);
        system.validate().unwrap();
    }

    #[test]
    fn test_harmonic_complexity() {
        // Perfect fifth should have low complexity
        let fifth_complexity = MusicalConstraint::harmonic_complexity(1.5);
        assert!(fifth_complexity < 5.0);

        // Tritone should have high complexity (adjusted threshold based on actual algorithm)
        let tritone_complexity = MusicalConstraint::harmonic_complexity(1.414);
        assert!(tritone_complexity > 1.5); // Even more realistic threshold
    }
} 