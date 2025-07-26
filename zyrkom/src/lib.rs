//! # Zyrkom: Zero-Knowledge Proofs Based on Musical Physics
//! 
//! Zyrkom is a revolutionary zero-knowledge proof framework that uses the immutable laws
//! of musical physics to generate cryptographic constraints. By basing constraints on
//! universal physical constants (like the 3:2 ratio of a perfect fifth), we eliminate
//! the human factor from constraint design and provide mathematical guarantees of correctness.
//! 
//! ## Core Principles
//! 
//! 1. **Physical Immutability**: All constraints derive from laws of acoustic physics
//! 2. **Zero Human Factor**: No arbitrary choices by developers  
//! 3. **Performance Critical**: Optimized for Circle STARKs and M31 field arithmetic
//! 4. **Type Safety**: Compile-time validation of musical relationships
//! 
//! ## Architecture
//! 
//! ```text
//! Musical Physics → Constraints → Circle STARKs → ZK Proofs
//! ```
//! 
//! ## Examples
//! 
//! ```rust
//! use zyrkom::musical::{MusicalInterval, MusicalNote, Chord};
//! 
//! // Create a perfect fifth (3:2 ratio - immutable physics)
//! let fifth = MusicalInterval::perfect_fifth();
//! assert_eq!(fifth.ratio(), 1.5);
//! 
//! // Create a major chord using just intonation
//! let root = MusicalNote::from_midi(60); // C4
//! let chord = Chord::major_triad(root);
//! 
//! // Convert to ZK constraints (coming soon)
//! // let constraints = chord.to_stark_constraints();
//! ```

#![warn(missing_docs)]
#![warn(clippy::all)]
#![forbid(unsafe_code)]

pub mod musical;
pub mod zk;
pub mod dsl;
pub mod utils;

pub use musical::{MusicalInterval, MusicalNote, Chord};
pub use dsl::{ZyrkomParser, ParsedElement};
pub use zk::{ZyrkomProver, ZyrkomVerifier, MusicalProof, ZyrkomComponent};

/// Common error types for Zyrkom operations
#[derive(Debug, thiserror::Error)]
pub enum ZyrkomError {
    /// Invalid musical interval that violates physics
    #[error("Invalid musical interval: ratio {ratio}, cents {cents}")]
    InvalidInterval { 
        /// The invalid frequency ratio
        ratio: f64, 
        /// The invalid cents value
        cents: f64 
    },
    
    /// STARK proof generation failed
    #[error("STARK proof generation failed: {reason}")]
    ProofError { 
        /// Detailed reason for proof failure
        reason: String 
    },
    
    /// Physics validation failed
    #[error("Physics validation failed: {details}")]
    PhysicsError { 
        /// Details about physics validation failure
        details: String 
    },
    
    /// DSL parsing error
    #[error("DSL parsing error: {message} at line {line}")]
    ParseError { 
        /// Error message describing the parse failure
        message: String, 
        /// Line number where the error occurred
        line: usize 
    },
    
    /// Constraint generation error
    #[error("Constraint generation error: {context}")]
    ConstraintError { 
        /// Context about constraint generation failure
        context: String 
    },
}

/// Result type for Zyrkom operations
pub type Result<T> = std::result::Result<T, ZyrkomError>;

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Build information  
pub const BUILD_INFO: &str = concat!(
    "Zyrkom v",
    env!("CARGO_PKG_VERSION"),
);

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_version_info() {
        assert!(!VERSION.is_empty());
        assert!(BUILD_INFO.contains("Zyrkom"));
    }
} 