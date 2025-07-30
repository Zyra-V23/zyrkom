//! Zero-Knowledge proof components for Zyrkom
//! 
//! This module contains the integration with Circle STARKs (Stwo)
//! and the conversion of musical constraints to arithmetic constraints.

/// Musical constraint generation for ZK proofs
pub mod constraints;
/// Circle STARK prover and verifier implementation
pub mod stark;
/// Stwo Component trait implementation for musical constraints
pub mod component;

pub use constraints::{
    MusicalConstraint,
    ConstraintSystem,
    ConstraintType,
    ToConstraints,
};

pub use stark::{
    ZyrkomProver,
    ZyrkomVerifier,
    MusicalProof,
    ZyrkomProofJson,
    ConstraintInfo,
    PublicInput,
    ProofGenerationInfo,
    StarkInfo,
};

pub use component::ZyrkomComponent; 