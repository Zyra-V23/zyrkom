//! Musical DNA - Unique musical fingerprint generation

use crate::musical::MusicalInterval;
use crate::zk::{ConstraintSystem, ZyrkomProver, MusicalConstraint};
use sha2::{Sha256, Digest};
use serde::{Serialize, Deserialize};
use bincode;

/// Musical DNA - Unique musical fingerprint for each person
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicalDna {
    /// Unique identifier
    pub fingerprint: String,
    
    /// Preferred intervals (sorted by preference)
    pub interval_preferences: Vec<(MusicalInterval, f64)>,
    
    /// Harmonic complexity score (0-100)
    pub harmonic_complexity: u8,
    
    /// Rhythm patterns preference
    pub rhythm_signature: Vec<f64>,
    
    /// Tonal center tendencies
    pub tonal_centers: Vec<String>,
    
    /// Unique color mapping
    pub synesthetic_color: String,
}

impl MusicalDna {
    /// Generate unique Musical DNA from user preferences
    pub fn generate(
        favorite_songs: &[String],
        listening_history: &[(String, u32)], // (song, play_count)
        preferred_genres: &[String],
    ) -> Self {
        // Hash all inputs to create unique fingerprint
        let mut hasher = Sha256::new();
        for song in favorite_songs {
            hasher.update(song.as_bytes());
        }
        for (song, count) in listening_history {
            hasher.update(song.as_bytes());
            hasher.update(count.to_le_bytes());
        }
        for genre in preferred_genres {
            hasher.update(genre.as_bytes());
        }
        
        let hash = hasher.finalize();
        let fingerprint = format!("MDNA-{}", hex::encode(&hash[..8]));
        
        // Extract interval preferences from the hash
        let interval_preferences = Self::extract_interval_preferences(&hash);
        
        // Calculate harmonic complexity based on preferences
        let harmonic_complexity = (hash[16] % 101) as u8;
        
        // Generate rhythm signature
        let rhythm_signature: Vec<f64> = hash[17..25]
            .iter()
            .map(|&b| (b as f64) / 255.0)
            .collect();
            
        // Determine tonal centers
        let tonal_centers = Self::extract_tonal_centers(&hash);
        
        // Generate synesthetic color (music -> color mapping)
        let synesthetic_color = format!("#{:02x}{:02x}{:02x}", 
            hash[5] ^ hash[10], hash[6] ^ hash[11], hash[7] ^ hash[12]);
        
        Self {
            fingerprint,
            interval_preferences,
            harmonic_complexity,
            rhythm_signature,
            tonal_centers,
            synesthetic_color,
        }
    }
    
    /// Extract preferred musical intervals from hash
    fn extract_interval_preferences(hash: &[u8]) -> Vec<(MusicalInterval, f64)> {
        let mut preferences = vec![
            (MusicalInterval::perfect_fifth(), (hash[0] as f64) / 255.0),
            (MusicalInterval::major_third(), (hash[1] as f64) / 255.0),
            (MusicalInterval::perfect_fourth(), (hash[2] as f64) / 255.0),
            (MusicalInterval::major_sixth(), (hash[3] as f64) / 255.0),
            (MusicalInterval::octave(), (hash[4] as f64) / 255.0),
        ];
        
        // Sort by preference score
        preferences.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        preferences
    }
    
    /// Extract tonal center preferences
    fn extract_tonal_centers(hash: &[u8]) -> Vec<String> {
        let notes = ["C", "D", "E", "F", "G", "A", "B"];
        let modifiers = ["", "#", "b"];
        
        let mut centers = Vec::new();
        for i in 0..3 {
            // Ensure we don't go out of bounds
            let idx1 = (10 + i * 2) % hash.len();
            let idx2 = (11 + i * 2) % hash.len();
            
            let note_idx = (hash[idx1] as usize) % notes.len();
            let mod_idx = (hash[idx2] as usize) % modifiers.len();
            centers.push(format!("{}{}", notes[note_idx], modifiers[mod_idx]));
        }
        
        centers
    }
    
    /// Generate ZK proof of Musical DNA ownership
    pub fn generate_ownership_proof(&self) -> Result<Vec<u8>, crate::ZyrkomError> {
        let mut constraints = ConstraintSystem::new();
        
        // Add interval preference constraints
        for (interval, preference) in &self.interval_preferences {
            // Create interval constraint using harmonic ratio type
            let constraint = MusicalConstraint::from_ratio(
                interval.ratio(), 
                crate::zk::ConstraintType::HarmonicRatio
            )?;
            constraints.add_constraint(constraint);
            
            // Add preference as a consonance constraint
            if *preference > 0.5 {  // Strong preference = consonance
                let pref_constraint = MusicalConstraint::from_ratio(
                    interval.ratio(),
                    crate::zk::ConstraintType::Consonance
                )?;
                constraints.add_constraint(pref_constraint);
            }
        }
        
        // Add harmonic complexity as tuning consistency
        let complexity_constraint = MusicalConstraint::from_ratio(
            2.0, // Use octave ratio as base
            crate::zk::ConstraintType::TuningConsistency
        )?;
        constraints.add_constraint(complexity_constraint);
        
        // Generate the proof
        let prover = ZyrkomProver::new(constraints)?;
        let proof = prover.prove()?;
        
        // Serialize the proof to bytes
        Ok(bincode::serialize(&proof)?)
    }
    
    /// Compare two Musical DNAs and calculate similarity
    pub fn similarity(&self, other: &Self) -> f64 {
        let mut score = 0.0;
        let mut weight = 0.0;
        
        // Compare interval preferences (40% weight)
        for (i, (interval1, pref1)) in self.interval_preferences.iter().enumerate() {
            if let Some((interval2, pref2)) = other.interval_preferences.get(i) {
                if interval1.ratio() == interval2.ratio() {
                    score += 0.4 * (1.0 - (pref1 - pref2).abs());
                }
            }
            weight += 0.4;
        }
        
        // Compare harmonic complexity (20% weight)
        let complexity_diff = (self.harmonic_complexity as f64 - other.harmonic_complexity as f64).abs();
        score += 0.2 * (1.0 - complexity_diff / 100.0);
        weight += 0.2;
        
        // Compare rhythm signatures (20% weight)
        let rhythm_similarity = self.calculate_rhythm_similarity(&other.rhythm_signature);
        score += 0.2 * rhythm_similarity;
        weight += 0.2;
        
        // Compare tonal centers (20% weight)
        let tonal_matches = self.tonal_centers.iter()
            .filter(|tc| other.tonal_centers.contains(tc))
            .count() as f64;
        score += 0.2 * (tonal_matches / self.tonal_centers.len() as f64);
        weight += 0.2;
        
        score / weight
    }
    
    /// Calculate rhythm signature similarity
    fn calculate_rhythm_similarity(&self, other_rhythm: &[f64]) -> f64 {
        let len = self.rhythm_signature.len().min(other_rhythm.len());
        if len == 0 {
            return 0.0;
        }
        
        let mut diff_sum = 0.0;
        for i in 0..len {
            diff_sum += (self.rhythm_signature[i] - other_rhythm[i]).abs();
        }
        
        1.0 - (diff_sum / len as f64)
    }
    
    /// Generate a visual representation of the Musical DNA
    pub fn to_visual_pattern(&self) -> String {
        let mut pattern = String::new();
        
        // Header
        pattern.push_str(&format!("🧬 Musical DNA: {}\n", self.fingerprint));
        pattern.push_str(&format!("🎨 Synesthetic Color: {}\n", self.synesthetic_color));
        pattern.push_str(&format!("📊 Harmonic Complexity: {}%\n", self.harmonic_complexity));
        
        // Interval preferences as bar chart
        pattern.push_str("\n🎵 Interval Preferences:\n");
        for (interval, preference) in &self.interval_preferences {
            let bars = "█".repeat((preference * 20.0) as usize);
            let interval_name = match (interval.ratio() * 1000.0).round() as u32 {
                1500 => "Perfect Fifth",
                1333 => "Perfect Fourth",
                2000 => "Octave",
                1667 => "Major Sixth",
                1250 => "Major Third",
                _ => "Custom Interval",
            };
            pattern.push_str(&format!("  {:.<20} {} {:.0}%\n", 
                interval_name, bars, preference * 100.0));
        }
        
        // Rhythm signature as wave
        pattern.push_str("\n🥁 Rhythm Signature:\n  ");
        for &value in &self.rhythm_signature {
            let height = (value * 5.0) as usize;
            pattern.push_str(match height {
                0 => "▁",
                1 => "▂",
                2 => "▃",
                3 => "▄",
                4 => "▅",
                _ => "█",
            });
        }
        pattern.push('\n');
        
        // Tonal centers
        pattern.push_str(&format!("\n🎹 Tonal Centers: {}\n", 
            self.tonal_centers.join(" → ")));
        
        pattern
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_musical_dna_generation() {
        let favorite_songs = vec![
            "Bohemian Rhapsody".to_string(),
            "Stairway to Heaven".to_string(),
            "Hotel California".to_string(),
        ];
        
        let listening_history = vec![
            ("Bohemian Rhapsody".to_string(), 42),
            ("Imagine".to_string(), 28),
            ("Yesterday".to_string(), 15),
        ];
        
        let genres = vec!["Rock".to_string(), "Classical".to_string()];
        
        let dna = MusicalDna::generate(&favorite_songs, &listening_history, &genres);
        
        println!("{}", dna.to_visual_pattern());
        
        assert!(dna.fingerprint.starts_with("MDNA-"));
        assert!(!dna.interval_preferences.is_empty());
        assert!(dna.harmonic_complexity <= 100);
    }
    
    #[test]
    fn test_musical_dna_similarity() {
        let songs1 = vec!["Song A".to_string()];
        let songs2 = vec!["Song B".to_string()];
        let history = vec![];
        let genres = vec!["Rock".to_string()];
        
        let dna1 = MusicalDna::generate(&songs1, &history, &genres);
        let dna2 = MusicalDna::generate(&songs2, &history, &genres);
        let dna3 = MusicalDna::generate(&songs1, &history, &genres); // Same as dna1
        
        let similarity_different = dna1.similarity(&dna2);
        let similarity_same = dna1.similarity(&dna3);
        
        println!("Different DNA similarity: {:.2}%", similarity_different * 100.0);
        println!("Same DNA similarity: {:.2}%", similarity_same * 100.0);
        
        assert!(similarity_same > 0.99); // Should be identical
        assert!(similarity_different < similarity_same);
    }
}