//! Utility functions for Zyrkom
//! 
//! This module contains helper functions and common utilities
//! used throughout the Zyrkom codebase.

/// Convert frequency to musical note name
pub fn frequency_to_note_name(frequency: f64) -> String {
    if frequency <= 0.0 {
        return "Invalid".to_string();
    }
    
    // A4 = 440Hz as reference (MIDI note 69)
    const A4_FREQUENCY: f64 = 440.0;
    const A4_MIDI: f64 = 69.0;
    
    // Convert frequency to MIDI note number using logarithmic scale
    let midi_note = A4_MIDI + 12.0 * (frequency / A4_FREQUENCY).log2();
    let midi_rounded = midi_note.round() as i32;
    
    // Note names within an octave
    const NOTE_NAMES: [&str; 12] = [
        "C", "C#", "D", "D#", "E", "F", 
        "F#", "G", "G#", "A", "A#", "B"
    ];
    
    if midi_rounded < 0 || midi_rounded > 127 {
        return format!("OutOfRange@{:.2}Hz", frequency);
    }
    
    let octave = (midi_rounded / 12) - 1;
    let note_index = (midi_rounded % 12) as usize;
    let note_name = NOTE_NAMES[note_index];
    
    // Calculate cents deviation from exact semitone
    let exact_frequency = A4_FREQUENCY * 2_f64.powf((midi_rounded as f64 - A4_MIDI) / 12.0);
    let cents_deviation = 1200.0 * (frequency / exact_frequency).log2();
    
    if cents_deviation.abs() < 5.0 {
        // Close enough to exact note
        format!("{}{}", note_name, octave)
    } else {
        // Show deviation for microtonal analysis
        format!("{}{}{:+.0}¢", note_name, octave, cents_deviation)
    }
}

/// Mathematical utilities for musical calculations
pub mod math {
    /// Calculate the greatest common divisor of two integers
    pub fn gcd(a: u64, b: u64) -> u64 {
        if b == 0 {
            a
        } else {
            gcd(b, a % b)
        }
    }
    
    /// Simplify a ratio to its lowest terms
    pub fn simplify_ratio(numerator: u64, denominator: u64) -> (u64, u64) {
        let divisor = gcd(numerator, denominator);
        (numerator / divisor, denominator / divisor)
    }
}

/// Audio utilities for musical testing and demonstration
#[cfg(feature = "audio")]
pub mod audio {
    use std::f32::consts::PI;
    use std::time::Duration;
    use rodio::Source; // Add the Source trait import
    
    /// Play a single frequency for a short duration
    /// Perfect for test validation and demos
    pub fn play_frequency(frequency: f64, duration_ms: u64) -> Result<(), Box<dyn std::error::Error>> {
        use rodio::{OutputStream, Sink};
        
        // Create audio output stream
        let (_stream, stream_handle) = OutputStream::try_default()?;
        let sink = Sink::try_new(&stream_handle)?;
        
        // Generate sine wave for the frequency
        let sample_rate = 44100;
        let duration = Duration::from_millis(duration_ms);
        let wave = SineWave::new(frequency as f32, sample_rate, duration);
        
        println!("🎵 Playing {}Hz for {}ms...", frequency, duration_ms);
        
        // Play the sound
        sink.append(wave);
        sink.sleep_until_end();
        
        Ok(())
    }
    
    /// Play a musical interval (two frequencies in sequence)
    /// Perfect for testing harmonic relationships
    pub fn play_interval(freq1: f64, freq2: f64, note_duration_ms: u64) -> Result<(), Box<dyn std::error::Error>> {
        let note1_name = crate::utils::frequency_to_note_name(freq1);
        let note2_name = crate::utils::frequency_to_note_name(freq2);
        let ratio = freq2 / freq1;
        
        println!("🎼 Playing interval: {} ({:.2}Hz) → {} ({:.2}Hz), ratio {:.3}", 
                 note1_name, freq1, note2_name, freq2, ratio);
        
        // Play first note
        play_frequency(freq1, note_duration_ms)?;
        
        // Small pause between notes
        std::thread::sleep(Duration::from_millis(50));
        
        // Play second note
        play_frequency(freq2, note_duration_ms)?;
        
        println!("✅ Interval played successfully!");
        Ok(())
    }
    
    /// Play a chord (multiple frequencies simultaneously)
    pub fn play_chord(frequencies: &[f64], duration_ms: u64) -> Result<(), Box<dyn std::error::Error>> {
        use rodio::{OutputStream, Sink};
        
        if frequencies.is_empty() {
            return Ok(());
        }
        
        let (_stream, stream_handle) = OutputStream::try_default()?;
        let sink = Sink::try_new(&stream_handle)?;
        
        println!("🎵 Playing chord with {} notes for {}ms...", frequencies.len(), duration_ms);
        for (i, &freq) in frequencies.iter().enumerate() {
            let note_name = crate::utils::frequency_to_note_name(freq);
            println!("   Note {}: {} ({:.2}Hz)", i + 1, note_name, freq);
        }
        
        // Create mixed sine waves for all frequencies
        let sample_rate = 44100;
        let duration = Duration::from_millis(duration_ms);
        let mixed_wave = ChordWave::new(frequencies.to_vec(), sample_rate, duration);
        
        sink.append(mixed_wave);
        sink.sleep_until_end();
        
        println!("✅ Chord played successfully!");
        Ok(())
    }
    
    /// Simple sine wave generator
    struct SineWave {
        frequency: f32,
        sample_rate: u32,
        samples_generated: usize,
        total_samples: usize,
    }
    
    impl SineWave {
        fn new(frequency: f32, sample_rate: u32, duration: Duration) -> Self {
            let total_samples = (sample_rate as f64 * duration.as_secs_f64()) as usize;
            Self {
                frequency,
                sample_rate,
                samples_generated: 0,
                total_samples,
            }
        }
    }
    
    impl Iterator for SineWave {
        type Item = f32;
        
        fn next(&mut self) -> Option<Self::Item> {
            if self.samples_generated >= self.total_samples {
                return None;
            }
            
            let t = self.samples_generated as f32 / self.sample_rate as f32;
            let sample = (2.0 * PI * self.frequency * t).sin() * 0.3; // 30% volume
            
            self.samples_generated += 1;
            Some(sample)
        }
    }
    
    impl Source for SineWave {
        fn current_frame_len(&self) -> Option<usize> {
            None
        }
        
        fn channels(&self) -> u16 {
            1
        }
        
        fn sample_rate(&self) -> u32 {
            self.sample_rate
        }
        
        fn total_duration(&self) -> Option<Duration> {
            Some(Duration::from_secs_f64(self.total_samples as f64 / self.sample_rate as f64))
        }
    }
    
    /// Chord wave generator (mix multiple frequencies)
    struct ChordWave {
        frequencies: Vec<f32>,
        sample_rate: u32,
        samples_generated: usize,
        total_samples: usize,
    }
    
    impl ChordWave {
        fn new(frequencies: Vec<f64>, sample_rate: u32, duration: Duration) -> Self {
            let total_samples = (sample_rate as f64 * duration.as_secs_f64()) as usize;
            Self {
                frequencies: frequencies.into_iter().map(|f| f as f32).collect(),
                sample_rate,
                samples_generated: 0,
                total_samples,
            }
        }
    }
    
    impl Iterator for ChordWave {
        type Item = f32;
        
        fn next(&mut self) -> Option<Self::Item> {
            if self.samples_generated >= self.total_samples {
                return None;
            }
            
            let t = self.samples_generated as f32 / self.sample_rate as f32;
            
            // Mix all frequencies together
            let mixed_sample: f32 = self.frequencies
                .iter()
                .map(|&freq| (2.0 * PI * freq * t).sin())
                .sum::<f32>() / self.frequencies.len() as f32; // Average to prevent clipping
            
            self.samples_generated += 1;
            Some(mixed_sample * 0.3) // 30% volume
        }
    }
    
    impl Source for ChordWave {
        fn current_frame_len(&self) -> Option<usize> {
            None
        }
        
        fn channels(&self) -> u16 {
            1
        }
        
        fn sample_rate(&self) -> u32 {
            self.sample_rate
        }
        
        fn total_duration(&self) -> Option<Duration> {
            Some(Duration::from_secs_f64(self.total_samples as f64 / self.sample_rate as f64))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_frequency_to_note_name_standard_notes() {
        // Test standard tuning frequencies
        assert_eq!(frequency_to_note_name(440.0), "A4");
        assert_eq!(frequency_to_note_name(261.63), "C4");
        assert_eq!(frequency_to_note_name(523.25), "C5");
        assert_eq!(frequency_to_note_name(880.0), "A5");
    }

    #[test]
    fn test_frequency_to_note_name_edge_cases() {
        // Test edge cases
        assert_eq!(frequency_to_note_name(0.0), "Invalid");
        assert_eq!(frequency_to_note_name(-100.0), "Invalid");
        
        // Very high frequency (should be out of range)
        let result = frequency_to_note_name(20000.0);
        assert!(result.starts_with("OutOfRange"));
    }

    #[test]
    fn test_frequency_to_note_name_microtonal() {
        // Test slightly detuned frequency (should show cents)
        let slightly_sharp_a4 = 445.0; // About +20 cents
        let result = frequency_to_note_name(slightly_sharp_a4);
        assert!(result.contains("A4") && result.contains("¢"));
    }

    #[test] 
    fn test_frequency_to_note_name_octaves() {
        // Test octave relationships
        assert_eq!(frequency_to_note_name(110.0), "A2");
        assert_eq!(frequency_to_note_name(220.0), "A3");
        assert_eq!(frequency_to_note_name(440.0), "A4");
        assert_eq!(frequency_to_note_name(880.0), "A5");
    }

    #[test]
    fn test_math_utilities() {
        // Test GCD
        assert_eq!(math::gcd(12, 8), 4);
        assert_eq!(math::gcd(3, 2), 1);
        assert_eq!(math::gcd(15, 5), 5);

        // Test ratio simplification
        assert_eq!(math::simplify_ratio(6, 4), (3, 2)); // Perfect fifth
        assert_eq!(math::simplify_ratio(5, 4), (5, 4)); // Major third (already simplified)
        assert_eq!(math::simplify_ratio(12, 8), (3, 2)); // Perfect fifth again
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_audio_frequency_playback() {
        println!("\n🎼 Testing audio playback...");
        
        // Test A4 = 440Hz
        if let Err(e) = audio::play_frequency(440.0, 300) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
            return;
        }
        
        println!("✅ Audio frequency test completed!");
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_audio_perfect_fifth() {
        println!("\n🎼 Testing perfect fifth interval...");
        
        // Test perfect fifth: C4 (261.63Hz) → G4 (392.00Hz)
        let c4 = 261.63;
        let g4 = 392.00;
        
        if let Err(e) = audio::play_interval(c4, g4, 400) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
            return;
        }
        
        println!("✅ Perfect fifth audio test completed!");
    }
    
    #[test]
    #[cfg(feature = "test-audio")]
    fn test_audio_major_chord() {
        println!("\n🎼 Testing C major chord...");
        
        // C major chord: C4, E4, G4
        let c_major = vec![261.63, 329.63, 392.00];
        
        if let Err(e) = audio::play_chord(&c_major, 800) {
            println!("⚠️ Audio test skipped (no audio device): {}", e);
            return;
        }
        
        println!("✅ C major chord audio test completed!");
    }
} 