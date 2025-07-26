//! Musical physics engine for Zyrkom
//! 
//! This module contains the core musical theory components based on immutable
//! physical constants. All types and functions here represent universal
//! mathematical relationships that exist in acoustic physics.

/// Physics constants and musical structures implementation
pub mod physics;

pub use physics::{
    MusicalInterval,
    MusicalNote, 
    Chord,
    constants,
}; 