//! Musical DNA Generator - Find your unique musical fingerprint!

use zyrkom::musical_dna::MusicalDna;
use clap::{Parser, Subcommand};
use colored::*;
use std::io::{self, Write};

#[derive(Parser)]
#[command(name = "musical-dna")]
#[command(about = "🧬 Generate your unique Musical DNA fingerprint", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate your Musical DNA from your music preferences
    Generate {
        /// Your name (for personalization)
        #[arg(short, long)]
        name: String,
    },
    /// Compare two Musical DNAs for compatibility
    Compare {
        /// First person's Musical DNA fingerprint
        #[arg(short = 'a', long)]
        dna_a: String,
        
        /// Second person's Musical DNA fingerprint  
        #[arg(short = 'b', long)]
        dna_b: String,
    },
    /// Interactive Musical DNA generation
    Interactive,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Generate { name } => generate_dna(&name),
        Commands::Compare { dna_a, dna_b } => compare_dnas(&dna_a, &dna_b),
        Commands::Interactive => interactive_generation(),
    }
}

fn generate_dna(name: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", "🧬 MUSICAL DNA GENERATOR v1.0".bright_cyan().bold());
    println!("{}", "━".repeat(50).bright_cyan());
    println!();
    
    // For demo, we'll use the name as seed for generation
    let favorite_songs = vec![
        format!("{}'s Favorite Song 1", name),
        format!("{}'s Favorite Song 2", name),
        format!("{}'s Favorite Song 3", name),
    ];
    
    let listening_history = vec![
        (format!("{}'s Top Track", name), 100),
        (format!("{}'s Hidden Gem", name), 50),
    ];
    
    let genres = vec!["Electronic".to_string(), "Classical".to_string()];
    
    println!("🎵 Analyzing musical preferences for {}...", name.bright_yellow());
    println!();
    
    // Generate the DNA
    let dna = MusicalDna::generate(&favorite_songs, &listening_history, &genres);
    
    // Display the visual pattern
    println!("{}", dna.to_visual_pattern());
    
    // Generate ZK proof
    println!("\n🔐 Generating Zero-Knowledge Proof of Musical Identity...");
    match dna.generate_ownership_proof() {
        Ok(proof) => {
            println!("✅ {} generated! Size: {} bytes", 
                "ZK Proof".bright_green().bold(),
                proof.len()
            );
            
            // Save ZK proof to .zkp file
            let zkp_filename = format!("musical_dna_{}.zkp", name.to_lowercase().replace(" ", "_"));
            match std::fs::write(&zkp_filename, &proof) {
                Ok(()) => {
                    println!("💾 ZK Proof saved to: {}", zkp_filename.bright_cyan());
                }
                Err(e) => {
                    println!("⚠️ Warning: Could not save ZK proof file: {}", e);
                }
            }
            
            println!("\n📋 Share your Musical DNA:");
            println!("   Fingerprint: {}", dna.fingerprint.bright_magenta().bold());
            println!("   Proof Hash: {}", 
                format!("{:x}", Sha256::digest(&proof))
                    .chars()
                    .take(16)
                    .collect::<String>()
                    .bright_blue()
            );
            println!("   Files generated: {} + {}", 
                filename.bright_green(), 
                zkp_filename.bright_green()
            );
        }
        Err(e) => {
            println!("❌ Error generating proof: {}", e);
        }
    }
    
    // Save to file
    let filename = format!("musical_dna_{}.json", name.to_lowercase().replace(" ", "_"));
    std::fs::write(&filename, serde_json::to_string_pretty(&dna)?)?;
    println!("\n💾 Saved to: {}", filename.bright_green());
    
    Ok(())
}

fn compare_dnas(dna_a: &str, dna_b: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", "🧬 MUSICAL DNA COMPATIBILITY CHECKER".bright_cyan().bold());
    println!("{}", "━".repeat(50).bright_cyan());
    println!();
    
    // For demo, generate DNAs from fingerprints
    let dna1 = MusicalDna::generate(
        &[dna_a.to_string()],
        &[],
        &["Rock".to_string()]
    );
    
    let dna2 = MusicalDna::generate(
        &[dna_b.to_string()],
        &[],
        &["Rock".to_string()]
    );
    
    let similarity = dna1.similarity(&dna2);
    let percentage = (similarity * 100.0) as u32;
    
    println!("🔬 Analyzing compatibility between:");
    println!("   DNA A: {}", dna_a.bright_magenta());
    println!("   DNA B: {}", dna_b.bright_magenta());
    println!();
    
    // Visual compatibility meter
    let bar_length = 30;
    let filled = (bar_length as f64 * similarity) as usize;
    let bar = format!("{}{}",
        "█".repeat(filled).bright_green(),
        "░".repeat(bar_length - filled).bright_black()
    );
    
    println!("📊 Compatibility Score:");
    println!("   [{}] {}%", bar, percentage);
    println!();
    
    // Interpretation
    let interpretation = match percentage {
        90..=100 => "🎵 Musical Soulmates! Your musical tastes are incredibly aligned!",
        70..=89 => "🎸 Great Match! You share many musical preferences!",
        50..=69 => "🎹 Good Compatibility! Some shared interests with room to explore!",
        30..=49 => "🥁 Different Styles! This could lead to interesting discoveries!",
        _ => "🎺 Opposites Attract? Your musical worlds are quite different!",
    };
    
    println!("{}", interpretation.bright_yellow().bold());
    
    Ok(())
}

fn interactive_generation() -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", "🧬 INTERACTIVE MUSICAL DNA GENERATOR".bright_cyan().bold());
    println!("{}", "━".repeat(50).bright_cyan());
    println!();
    
    // Get user input
    print!("👤 Enter your name: ");
    io::stdout().flush()?;
    let mut name = String::new();
    io::stdin().read_line(&mut name)?;
    let name = name.trim();
    
    println!("\n🎵 Let's discover your Musical DNA!\n");
    
    // Favorite songs
    let mut favorite_songs = Vec::new();
    println!("📝 Enter your 3 favorite songs (press Enter after each):");
    for i in 1..=3 {
        print!("   {}. ", i);
        io::stdout().flush()?;
        let mut song = String::new();
        io::stdin().read_line(&mut song)?;
        if !song.trim().is_empty() {
            favorite_songs.push(song.trim().to_string());
        }
    }
    
    // Genres
    println!("\n🎸 Select your favorite genres (enter numbers separated by space):");
    let genres_list = vec![
        "Rock", "Pop", "Classical", "Jazz", "Electronic", 
        "Hip-Hop", "Metal", "Folk", "R&B", "Country"
    ];
    
    for (i, genre) in genres_list.iter().enumerate() {
        println!("   {}. {}", i + 1, genre);
    }
    
    print!("\n   Your choices: ");
    io::stdout().flush()?;
    let mut genre_input = String::new();
    io::stdin().read_line(&mut genre_input)?;
    
    let selected_genres: Vec<String> = genre_input
        .split_whitespace()
        .filter_map(|s| s.parse::<usize>().ok())
        .filter_map(|i| genres_list.get(i - 1))
        .map(|s| s.to_string())
        .collect();
    
    // Create listening history from favorites
    let listening_history: Vec<(String, u32)> = favorite_songs
        .iter()
        .enumerate()
        .map(|(i, song)| (song.clone(), (100 - i as u32 * 20)))
        .collect();
    
    println!("\n🧪 Generating your unique Musical DNA...\n");
    
    // Generate DNA
    let dna = MusicalDna::generate(&favorite_songs, &listening_history, &selected_genres);
    
    // Animated reveal
    for line in dna.to_visual_pattern().lines() {
        println!("{}", line);
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    
    // Generate and display proof
    println!("\n🔐 Creating Zero-Knowledge Proof of your Musical Identity...");
    match dna.generate_ownership_proof() {
        Ok(proof) => {
            println!("✅ {} successfully generated!", "ZK Proof".bright_green().bold());
            
            // Save ZK proof to .zkp file
            let zkp_filename = format!("musical_dna_{}.zkp", name.to_lowercase().replace(" ", "_"));
            match std::fs::write(&zkp_filename, &proof) {
                Ok(()) => {
                    println!("💾 ZK Proof saved to: {}", zkp_filename.bright_cyan());
                }
                Err(e) => {
                    println!("⚠️ Warning: Could not save ZK proof file: {}", e);
                }
            }
            
            println!("\n🎉 Congratulations, {}!", name.bright_yellow());
            println!("   Your Musical DNA is: {}", dna.fingerprint.bright_magenta().bold());
            println!("   This fingerprint is cryptographically unique to you!");
            
            // Save results
            let filename = format!("musical_dna_{}.json", name.to_lowercase().replace(" ", "_"));
            std::fs::write(&filename, serde_json::to_string_pretty(&dna)?)?;
            println!("\n💾 Files saved:");
            println!("   📄 JSON: {}", filename.bright_green());
            println!("   🔐 ZK Proof: {}", zkp_filename.bright_cyan());
            
            // Share instructions
            println!("\n📤 Share your Musical DNA:");
            println!("   1. Post your fingerprint: {}", dna.fingerprint.bright_magenta());
            println!("   2. Upload your proof files to verify ownership");
            println!("   3. Compare compatibility with friends!");
        }
        Err(e) => {
            println!("❌ Error generating proof: {}", e);
        }
    }
    
    Ok(())
}

// Add SHA2 import for proof hashing
use sha2::{Sha256, Digest};