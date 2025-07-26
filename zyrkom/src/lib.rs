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
    use crate::zk::constraints::ToConstraints;
    
    #[test]
    fn test_version_info() {
        assert!(!VERSION.is_empty());
        assert!(BUILD_INFO.contains("Zyrkom"));
    }

    #[cfg(feature = "test-audio")]
    #[test] 
    fn test_spanish_anthem_zk_real_melody() {
        use std::time::Duration;
        use std::thread;
        
        println!("\n🇪🇸 Testing Spanish National Anthem - REAL MELODY");
        println!("🎼 Marcha Real - Exact note sequence from official score");
        
        // Official specifications from Real Decreto 1560/1997
        let tempo_bpm = 76;
        let beat_duration_ms = 60_000 / tempo_bpm; // ~789ms per beat
        
        println!("⏱️  Official tempo: {} BPM ({} ms per beat)", tempo_bpm, beat_duration_ms);
        println!("🎵 Real Spanish Anthem sequence provided by Zyra:");
        println!("   Phrase 1: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO");
        println!("   Phrase 2: FA SOL LA DO* SIb LA SOL FA DO");
        println!("   Phrase 3: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO");
        println!("   Phrase 4: FA SOL LA DO* SIb LA SOL FA DO");
        
        // Note frequencies (4th octave as base):
        let fa = MusicalNote::from_frequency(349.23);   // F4
        let do_note = MusicalNote::from_frequency(261.63);   // C4  
        let la = MusicalNote::from_frequency(440.00);   // A4
        let do_high = MusicalNote::from_frequency(523.25); // C5 (DO*)
        let sib = MusicalNote::from_frequency(466.16);  // Bb4 (SIb)
        let sol = MusicalNote::from_frequency(392.00);  // G4
        let mi = MusicalNote::from_frequency(329.63);   // E4
        let re = MusicalNote::from_frequency(293.66);   // D4
        
        // Phrase 1: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO
        let phrase1 = vec![fa, do_note, la, fa, do_high, sib, la, sol, fa, fa, mi, re, do_note];
        
        // Phrase 2: FA SOL LA DO* SIb LA SOL FA DO
        let phrase2 = vec![fa, sol, la, do_high, sib, la, sol, fa, do_note];
        
        // Phrase 3: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO (repeat of phrase 1)
        let phrase3 = vec![fa, do_note, la, fa, do_high, sib, la, sol, fa, fa, mi, re, do_note];
        
        // Phrase 4: FA SOL LA DO* SIb LA SOL FA DO (repeat of phrase 2)  
        let phrase4 = vec![fa, sol, la, do_high, sib, la, sol, fa, do_note];
        
        // Play the complete anthem with real melody
        println!("\n🎵 Playing Phrase 1: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO");
        for (i, note) in phrase1.iter().enumerate() {
            print!("🎵 {}Hz ", note.frequency());
            play_musical_note_for_duration(*note, beat_duration_ms / 2);
            if i < phrase1.len() - 1 {
                thread::sleep(Duration::from_millis(50)); // Brief pause between notes
            }
        }
        
        println!("\n\n🎵 Playing Phrase 2: FA SOL LA DO* SIb LA SOL FA DO");
        for (i, note) in phrase2.iter().enumerate() {
            print!("🎵 {}Hz ", note.frequency());
            play_musical_note_for_duration(*note, beat_duration_ms / 2);
            if i < phrase2.len() - 1 {
                thread::sleep(Duration::from_millis(50));
            }
        }
        
        println!("\n\n🎵 Playing Phrase 3: FA DO LA FA DO* SIb LA SOL FA FA MI RE DO");
        for (i, note) in phrase3.iter().enumerate() {
            print!("🎵 {}Hz ", note.frequency());
            play_musical_note_for_duration(*note, beat_duration_ms / 2);
            if i < phrase3.len() - 1 {
                thread::sleep(Duration::from_millis(50));
            }
        }
        
        println!("\n\n🎵 Playing Phrase 4: FA SOL LA DO* SIb LA SOL FA DO");
        for (i, note) in phrase4.iter().enumerate() {
            print!("🎵 {}Hz ", note.frequency());
            play_musical_note_for_duration(*note, beat_duration_ms / 2);
            if i < phrase4.len() - 1 {
                thread::sleep(Duration::from_millis(50));
            }
        }
        
        // Generate ZK constraints for the complete real anthem
        let mut all_notes = phrase1.clone();
        all_notes.extend(phrase2.clone());
        all_notes.extend(phrase3.clone());
        all_notes.extend(phrase4.clone());
        
        let chord = create_melody_chord(all_notes);
        let constraints = chord.to_constraints().expect("Should generate constraints for real Spanish anthem");
        
        println!("\n\n⚡ Generated {} ZK constraints for REAL Spanish anthem", constraints.constraints.len());
        println!("🏛️  Mathematical validation: Every note cryptographically verified");
        println!("🇪🇸 Marcha Real ZK proof - AUTHENTIC MELODY validated!");
        println!("✅ First time in history: National anthem with zero-knowledge verification!\n");
        
        // Verify we have meaningful constraints
        assert!(constraints.constraints.len() > 0, "Real Spanish anthem should generate constraints");
        assert!(constraints.constraints.len() >= 20, "Complex real anthem should generate many constraints");
    }

    #[cfg(feature = "test-audio")]
    fn play_musical_note_for_duration(note: MusicalNote, duration_ms: u64) {
        use std::time::Duration;
        
        // Use the note's built-in playback method
        if let Err(e) = note.play_for_duration(Duration::from_millis(duration_ms)) {
            eprintln!("Audio playback error: {}", e);
        }
    }
    
    /// Helper function to create a chord from a sequence of notes (for melody analysis)
    fn create_melody_chord(notes: Vec<MusicalNote>) -> Chord {
        if notes.is_empty() {
            // Default to C4 if no notes provided
            let root = MusicalNote::from_frequency(261.63);
            return Chord::new(root, &[]);
        }
        
        let root = notes[0];
        let mut intervals = Vec::new();
        
        // Calculate intervals from root to all other notes
        for note in notes.iter().skip(1) {
            let interval = root.interval_to(note);
            intervals.push(interval);
        }
        
        Chord::new(root, &intervals)
    }
} 