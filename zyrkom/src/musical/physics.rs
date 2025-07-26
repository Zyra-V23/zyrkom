/// Musical Physics Engine for Zyrkom
/// 
/// This module contains immutable physical constants derived from the laws of acoustic physics.
/// These ratios cannot be changed by humans - they represent universal mathematical relationships
/// that exist in nature.

// Note: PI import removed as not currently used

/// Perfect mathematical ratios derived from harmonic series
/// These are NOT human conventions - they are physical laws
pub mod constants {
    /// Octave ratio: exactly 2:1 (fundamental frequency doubling)
    pub const OCTAVE_RATIO: f64 = 2.0;
    
    /// Perfect fifth ratio: exactly 3:2 (third harmonic relationship)  
    pub const PERFECT_FIFTH_RATIO: f64 = 1.5;
    
    /// Perfect fourth ratio: exactly 4:3 (fourth harmonic relationship)
    pub const PERFECT_FOURTH_RATIO: f64 = 4.0 / 3.0;
    
    /// Major third ratio: exactly 5:4 (fifth harmonic relationship)
    pub const MAJOR_THIRD_RATIO: f64 = 1.25;
    
    /// Minor third ratio: exactly 6:5 (sixth harmonic relationship)  
    pub const MINOR_THIRD_RATIO: f64 = 6.0 / 5.0;
    
    /// Equal temperament semitone ratio: 2^(1/12)
    pub const SEMITONE_RATIO: f64 = 1.0594630943592953;
    
    /// Concert pitch A4 frequency in Hz
    pub const CONCERT_PITCH_A4: f64 = 440.0;
    
    /// Cents per octave (logarithmic scale)
    pub const CENTS_PER_OCTAVE: f64 = 1200.0;
}

/// Type-safe musical interval representation
/// Enforces physical validity at compile time where possible
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MusicalInterval {
    /// Frequency ratio (must be > 1.0 for ascending intervals)
    ratio: f64,
    /// Interval size in cents (logarithmic scale)  
    cents: f64,
}

impl MusicalInterval {
    /// Create a new musical interval with compile-time validation
    /// Returns None if the ratio violates physical laws
    pub const fn new(ratio: f64, cents: f64) -> Option<Self> {
        if Self::validate_interval(ratio, cents) {
            Some(Self { ratio, cents })
        } else {
            None
        }
    }
    
    /// Compile-time validation of interval physics
    const fn validate_interval(ratio: f64, cents: f64) -> bool {
        // Ascending intervals must have ratio > 1.0
        if ratio <= 1.0 || ratio > 10.0 {
            return false;
        }
        
        // Cents must be positive for ascending intervals  
        if cents <= 0.0 || cents > 4000.0 {
            return false;
        }
        
        true
    }
    
    /// Perfect fifth - immutable physical constant
    pub const fn perfect_fifth() -> Self {
        Self {
            ratio: constants::PERFECT_FIFTH_RATIO,
            cents: 701.955, // Exact value for 3:2 ratio
        }
    }
    
    /// Perfect fourth - immutable physical constant  
    pub const fn perfect_fourth() -> Self {
        Self {
            ratio: constants::PERFECT_FOURTH_RATIO,
            cents: 498.045, // Exact value for 4:3 ratio
        }
    }
    
    /// Major third - immutable physical constant
    pub const fn major_third() -> Self {
        Self {
            ratio: constants::MAJOR_THIRD_RATIO,
            cents: 386.314, // Exact value for 5:4 ratio
        }
    }
    
    /// Octave - immutable physical constant
    pub const fn octave() -> Self {
        Self {
            ratio: constants::OCTAVE_RATIO,
            cents: constants::CENTS_PER_OCTAVE,
        }
    }
    
    /// Get the frequency ratio of this interval
    pub fn ratio(&self) -> f64 {
        self.ratio
    }
    
    /// Get the interval size in cents
    pub fn cents(&self) -> f64 {
        self.cents
    }
    
    /// Convert ratio to cents using logarithmic formula
    /// cents = 1200 * log2(ratio)
    pub fn ratio_to_cents(ratio: f64) -> f64 {
        constants::CENTS_PER_OCTAVE * ratio.log2()
    }
    
    /// Convert cents to ratio using exponential formula  
    /// ratio = 2^(cents/1200)
    pub fn cents_to_ratio(cents: f64) -> f64 {
        2.0_f64.powf(cents / constants::CENTS_PER_OCTAVE)
    }
    
    /// Combine two intervals by multiplying their ratios
    /// This represents stacking intervals on top of each other
    pub fn combine(&self, other: &Self) -> Self {
        let new_ratio = self.ratio * other.ratio;
        let new_cents = self.cents + other.cents;
        
        Self {
            ratio: new_ratio,
            cents: new_cents,
        }
    }
    
    /// Invert an interval (ascending becomes descending)
    pub fn invert(&self) -> Self {
        Self {
            ratio: 1.0 / self.ratio,
            cents: -self.cents,
        }
    }
}

/// Musical note representation with frequency
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MusicalNote {
    /// Fundamental frequency in Hz
    frequency: f64,
    /// MIDI note number (A4 = 69)
    midi_number: u8,
}

impl MusicalNote {
    /// Create a note from MIDI number
    pub fn from_midi(midi_number: u8) -> Self {
        let frequency = Self::midi_to_frequency(midi_number);
        Self {
            frequency,
            midi_number,
        }
    }
    
    /// Create a note from frequency
    pub fn from_frequency(frequency: f64) -> Self {
        let midi_number = Self::frequency_to_midi(frequency);
        Self {
            frequency,
            midi_number,
        }
    }
    
    /// Convert MIDI number to frequency using equal temperament
    /// f = 440 * 2^((midi - 69) / 12)
    fn midi_to_frequency(midi_number: u8) -> f64 {
        let semitones_from_a4 = (midi_number as f64) - 69.0;
        constants::CONCERT_PITCH_A4 * 2.0_f64.powf(semitones_from_a4 / 12.0)
    }
    
    /// Convert frequency to MIDI number
    /// midi = 69 + 12 * log2(f / 440)
    fn frequency_to_midi(frequency: f64) -> u8 {
        let ratio_to_a4 = frequency / constants::CONCERT_PITCH_A4;
        let semitones_from_a4 = 12.0 * ratio_to_a4.log2();
        (69.0 + semitones_from_a4).round() as u8
    }
    
    /// Get the frequency of this note
    pub fn frequency(&self) -> f64 {
        self.frequency
    }
    
    /// Get the MIDI number of this note
    pub fn midi_number(&self) -> u8 {
        self.midi_number
    }
    
    /// Calculate the interval between two notes
    pub fn interval_to(&self, other: &Self) -> MusicalInterval {
        let ratio = other.frequency / self.frequency;
        let cents = MusicalInterval::ratio_to_cents(ratio);
        
        MusicalInterval {
            ratio,
            cents,
        }
    }
    
    /// Transpose this note by an interval
    pub fn transpose(&self, interval: &MusicalInterval) -> Self {
        let new_frequency = self.frequency * interval.ratio();
        Self::from_frequency(new_frequency)
    }
}

/// A chord is a collection of notes played simultaneously
#[derive(Debug, Clone)]
pub struct Chord {
    /// The notes that make up this chord
    notes: Vec<MusicalNote>,
    /// The root note of the chord
    root: MusicalNote,
}

impl Chord {
    /// Create a new chord from a root note and intervals
    pub fn new(root: MusicalNote, intervals: &[MusicalInterval]) -> Self {
        let mut notes = vec![root];
        
        for interval in intervals {
            let note = root.transpose(interval);
            notes.push(note);
        }
        
        Self { notes, root }
    }
    
    /// Create a major triad using just intonation (5:4:6 ratios)
    pub fn major_triad(root: MusicalNote) -> Self {
        let intervals = [
            MusicalInterval::major_third(),   // 5:4 ratio
            MusicalInterval::perfect_fifth(), // 3:2 ratio
        ];
        
        Self::new(root, &intervals)
    }
    
    /// Get all notes in the chord
    pub fn notes(&self) -> &[MusicalNote] {
        &self.notes
    }
    
    /// Get the root note
    pub fn root(&self) -> MusicalNote {
        self.root
    }
    
    /// Get the number of notes in the chord
    pub fn note_count(&self) -> usize {
        self.notes.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perfect_fifth_ratio() {
        let fifth = MusicalInterval::perfect_fifth();
        assert_eq!(fifth.ratio(), 1.5);
        assert!((fifth.cents() - 701.955).abs() < 0.1); // Use the exact value
        
        // Test frequency calculation
        let c4 = MusicalNote::from_frequency(261.63);
        let g4 = c4.transpose(&fifth);
        assert!((g4.frequency() - 392.445).abs() < 0.1);
    }

    #[test]
    fn test_major_third_ratio() {
        let third = MusicalInterval::major_third();
        assert_eq!(third.ratio(), 1.25);
        assert!((third.cents() - 386.314).abs() < 0.1); // Use the exact value
    }

    #[test]
    fn test_octave_doubling() {
        let octave = MusicalInterval::octave();
        assert_eq!(octave.ratio(), 2.0);
        assert_eq!(octave.cents(), 1200.0);
        
        let a4 = MusicalNote::from_frequency(440.0);
        let a5 = a4.transpose(&octave);
        assert_eq!(a5.frequency(), 880.0);
    }

    #[test]
    fn test_interval_combination() {
        let fourth = MusicalInterval::perfect_fourth();
        let fifth = MusicalInterval::perfect_fifth();
        
        // Fourth + Fifth should equal an Octave (approximately)
        let combined = fourth.combine(&fifth);
        
        // 4/3 * 3/2 = 2.0 (octave)
        assert!((combined.ratio() - 2.0).abs() < 0.001);
    }

    #[test]
    fn test_major_triad_physics() {
        let c4 = MusicalNote::from_frequency(261.63);
        let chord = Chord::major_triad(c4);
        
        assert_eq!(chord.notes().len(), 3);
        
        // Test ratios are correct for just intonation
        let frequencies: Vec<f64> = chord.notes().iter().map(|n| n.frequency()).collect();
        
        // Major third ratio (5:4 = 1.25)
        let third_ratio = frequencies[1] / frequencies[0];
        assert!((third_ratio - 1.25).abs() < 0.01);
        
        // Perfect fifth ratio (3:2 = 1.5)
        let fifth_ratio = frequencies[2] / frequencies[0];
        assert!((fifth_ratio - 1.5).abs() < 0.01);
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_perfect_fifth_audio() {
        println!("\n🎼 Audio test: Perfect Fifth (3:2 ratio)");
        let fifth = MusicalInterval::perfect_fifth();
        
        // Test with C4 → G4
        let c4_freq = 261.63;
        let g4_freq = c4_freq * fifth.ratio();
        
        println!("Expected ratio: {:.3}, Calculated: {:.3}", 
                 fifth.ratio(), g4_freq / c4_freq);
        
        // Play the interval if audio is available
        if let Err(e) = crate::utils::audio::play_interval(c4_freq, g4_freq, 500) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
        }
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_major_third_audio() {
        println!("\n🎼 Audio test: Major Third (5:4 ratio)");
        let third = MusicalInterval::major_third();
        
        // Test with C4 → E4
        let c4_freq = 261.63;
        let e4_freq = c4_freq * third.ratio();
        
        println!("Expected ratio: {:.3}, Calculated: {:.3}", 
                 third.ratio(), e4_freq / c4_freq);
        
        if let Err(e) = crate::utils::audio::play_interval(c4_freq, e4_freq, 500) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
        }
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_major_triad_audio() {
        println!("\n🎼 Audio test: C Major Triad");
        let c4 = MusicalNote::from_frequency(261.63);
        let chord = Chord::major_triad(c4);
        
        let frequencies: Vec<f64> = chord.notes().iter().map(|n| n.frequency()).collect();
        
        println!("Playing C Major chord:");
        for (i, (note, freq)) in chord.notes().iter().zip(frequencies.iter()).enumerate() {
            let note_name = crate::utils::frequency_to_note_name(*freq);
            println!("  Note {}: {} ({:.2}Hz)", i + 1, note_name, freq);
        }
        
        if let Err(e) = crate::utils::audio::play_chord(&frequencies, 1000) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
        }
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_octave_audio() {
        println!("\n🎼 Audio test: Octave (2:1 ratio)");
        let octave = MusicalInterval::octave();
        
        // Test with A4 → A5
        let a4_freq = 440.0;
        let a5_freq = a4_freq * octave.ratio();
        
        println!("A4 → A5: {:.1}Hz → {:.1}Hz (ratio {:.1})", 
                 a4_freq, a5_freq, octave.ratio());
        
        if let Err(e) = crate::utils::audio::play_interval(a4_freq, a5_freq, 600) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
        }
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_harmonic_series_audio() {
        println!("\n🎼 Audio test: Harmonic Series (first 5 harmonics)");
        
        // Generate first 5 harmonics of C2 (65.41Hz)
        let fundamental = 65.41; // C2
        let harmonics: Vec<f64> = (1..=5).map(|n| fundamental * n as f64).collect();
        
        println!("Playing harmonic series of C2:");
        for (i, &freq) in harmonics.iter().enumerate() {
            let note_name = crate::utils::frequency_to_note_name(freq);
            println!("  Harmonic {}: {} ({:.2}Hz)", i + 1, note_name, freq);
        }
        
        // Play harmonics sequentially
        for &freq in &harmonics {
            if let Err(e) = crate::utils::audio::play_frequency(freq, 400) {
                println!("⚠️ Audio test skipped (no audio device): {}", e);
                return;
            }
            std::thread::sleep(std::time::Duration::from_millis(100));
        }
        
        println!("✅ Harmonic series played successfully!");
    }
} 