/// Zyrkom CLI - Musical Zero-Knowledge Proof Tool
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use zyrkom::{ZyrkomParser, ZyrkomProver, ZyrkomVerifier, Result};

#[derive(Parser)]
#[command(name = "zyrkom")]
#[command(about = "Musical Zero-Knowledge Proof Framework")]
#[command(version = "0.1.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Parse musical DSL and show constraints
    Parse {
        /// Input file with musical DSL (.zyrkom extension)
        #[arg(short, long)]
        input: PathBuf,
        /// Output format (constraints, json)
        #[arg(short, long, default_value = "constraints")]
        format: String,
    },
    /// Generate ZK proof from musical DSL
    Prove {
        /// Input file with musical DSL (.zyrkom extension)
        #[arg(short, long)]
        input: PathBuf,
        /// Output proof file
        #[arg(short, long)]
        output: PathBuf,
        /// Use GPU acceleration if available
        #[arg(long)]
        gpu: bool,
    },
    /// Verify a ZK proof
    Verify {
        /// Proof file to verify (.zk extension)
        #[arg(short, long)]
        proof: PathBuf,
        /// Original source file used for proving (.zyrkom extension)  
        #[arg(short, long)]
        source: PathBuf,
        /// Show detailed verification info
        #[arg(short, long)]
        verbose: bool,
    },
    /// Interactive DSL shell
    Shell,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Parse { input, format } => {
            handle_parse(input, format)
        }
        Commands::Prove { input, output, gpu } => {
            handle_prove(input, output, gpu)
        }
        Commands::Verify { proof, source, verbose } => {
            handle_verify(proof, source, verbose)
        }
        Commands::Shell => {
            println!("🎼 Zyrkom Interactive Shell");
            println!("==========================");
            println!();
            println!("Available commands:");
            println!("  📝 parse <file.zyrkom>                 - Parse and analyze musical DSL");
            println!("  🔮 prove <input.zyrkom> <output.zk>    - Generate ZK proof");
            println!("  🔍 verify <proof.zk> <source.zyrkom>   - Verify proof against original source");
            println!("  🚪 exit                               - Exit shell");
            println!();
            println!("Examples:");
            println!("  zyrkom parse examples/sample_music.zyrkom");
            println!("  zyrkom prove examples/sample_music.zyrkom my_proof.zk");
            println!("  zyrkom verify my_proof.zk examples/sample_music.zyrkom --verbose");
            println!();
            println!("🔒 Security Note: Verification requires the original source file");
            println!("   This follows industry best practices for ZK proof verification.");
            
            Ok(())
        }
    }
}

fn handle_parse(input: PathBuf, format: String) -> Result<()> {
    let content = std::fs::read_to_string(&input)
        .map_err(|e| zyrkom::ZyrkomError::ParseError {
            message: format!("Cannot read file: {}", e),
            line: 0,
        })?;

    let parser = ZyrkomParser::new();
    let elements = parser.parse_multiple(&content)?;

    match format.as_str() {
        "constraints" => {
            println!("🎼 Parsed Musical Elements:");
            for element in &elements {
                println!("  📝 {}: {}", element.name(), get_element_type(element));
                
                let constraints = element.to_constraints()?;
                if constraints.constraint_count() > 0 {
                    println!("     ⚡ {} constraints generated", constraints.constraint_count());
                }
            }
        }
        "json" => {
            println!("{{");
            println!("  \"elements\": [");
            for (i, element) in elements.iter().enumerate() {
                let constraints = element.to_constraints()?;
                println!("    {{");
                println!("      \"name\": \"{}\",", element.name());
                println!("      \"type\": \"{}\",", get_element_type(element));
                println!("      \"constraints\": {}", constraints.constraint_count());
                print!("    }}");
                if i < elements.len() - 1 {
                    println!(",");
                } else {
                    println!();
                }
            }
            println!("  ]");
            println!("}}");
        }
        _ => {
            return Err(zyrkom::ZyrkomError::ParseError {
                message: format!("Unknown format: {}", format),
                line: 0,
            });
        }
    }

    Ok(())
}

fn handle_prove(input: PathBuf, output: PathBuf, _gpu: bool) -> Result<()> {
    let content = std::fs::read_to_string(&input)
        .map_err(|e| zyrkom::ZyrkomError::ParseError {
            message: format!("Cannot read file: {}", e),
            line: 0,
        })?;

    println!("🔮 Generating ZK proof...");
    
    let parser = ZyrkomParser::new();
    let elements = parser.parse_multiple(&content)?;
    
    // Find first element that can generate constraints
    let mut total_constraints = None;
    for element in &elements {
        let constraints = element.to_constraints()?;
        if constraints.constraint_count() > 0 {
            total_constraints = Some(constraints);
            break;
        }
    }
    
    let constraints = total_constraints.ok_or_else(|| zyrkom::ZyrkomError::ConstraintError {
        context: "No valid constraints found in input".to_string(),
    })?;
    
    println!("  📊 {} constraints generated", constraints.constraint_count());
    
    let prover = ZyrkomProver::new(constraints)?;
    let proof = prover.prove()?;
    
    println!("  ✅ Proof generated successfully");
    println!("  📏 Proof size: {} bytes", proof.stark_proof.size_estimate());
    println!("  🎼 Structure: {}", proof.metadata.structure_type);
    
    // Save proof as binary
    let proof_bytes = bincode::serialize(&proof)
        .map_err(|e| zyrkom::ZyrkomError::ProofError {
            reason: format!("Serialization failed: {}", e),
        })?;
    
    std::fs::write(&output, proof_bytes)
        .map_err(|e| zyrkom::ZyrkomError::ProofError {
            reason: format!("Cannot write proof file: {}", e),
        })?;
    
    println!("  💾 Proof saved to: {}", output.display());
    
    Ok(())
}

fn handle_verify(proof_path: PathBuf, source_path: PathBuf, verbose: bool) -> Result<()> {
    println!("🔍 Verifying ZK proof...");
    
    if verbose {
        println!("  📂 Loading proof from: {}", proof_path.display());
        println!("  📂 Loading source from: {}", source_path.display());
    }
    
    // Load proof from file (fix format mismatch - prove saves as bincode)
    let proof_bytes = std::fs::read(&proof_path)
        .map_err(|e| zyrkom::ZyrkomError::ProofError {
            reason: format!("Failed to read proof file: {}", e),
        })?;
    
    let proof: zyrkom::MusicalProof = bincode::deserialize(&proof_bytes)
        .map_err(|e| zyrkom::ZyrkomError::ProofError {
            reason: format!("Failed to parse proof file: {}", e),
        })?;

    // Load and parse the ORIGINAL source file used for proving
    let source_content = std::fs::read_to_string(&source_path)
        .map_err(|e| zyrkom::ZyrkomError::ParseError {
            message: format!("Cannot read source file: {}", e),
            line: 0,
        })?;
    
    if verbose {
        println!("  📋 Proof metadata:");
        println!("    🎵 Structure: {}", proof.metadata.structure_type);
        println!("    🔢 Constraints: {}", proof.metadata.constraint_count);
        println!("    🎯 Musical ratios: {:?}", proof.metadata.musical_ratios);
        println!("    📊 Public inputs: {:?}", proof.public_inputs);
    }

    // Parse the original source file to get the TRUE constraint system
    println!("  📝 Parsing original source file...");
    let parser = zyrkom::ZyrkomParser::new();
    let elements = parser.parse_multiple(&source_content)?;
    
    // Generate the TRUSTED constraint system from source (same as proving)
    let mut trusted_constraint_system = None;
    for element in &elements {
        let constraints = element.to_constraints()?;
        if constraints.constraint_count() > 0 {
            trusted_constraint_system = Some(constraints);
            break;
        }
    }
    
    let constraint_system = trusted_constraint_system.ok_or_else(|| {
        zyrkom::ZyrkomError::ConstraintError {
            context: "No valid constraints found in source file".to_string(),
        }
    })?;

    if verbose {
        println!("  ✅ Source parsed: {} constraints generated", constraint_system.constraint_count());
        println!("  🔒 Using TRUSTED constraint system from source");
    }

    // INTEGRITY CHECK: Verify proof claims match source-derived constraints
    println!("  🛡️  Performing integrity checks...");
    
    if proof.metadata.constraint_count != constraint_system.constraint_count() {
        println!("  ❌ INTEGRITY VIOLATION: Constraint count mismatch!");
        println!("     Source: {} constraints", constraint_system.constraint_count());
        println!("     Proof claims: {} constraints", proof.metadata.constraint_count);
        return Err(zyrkom::ZyrkomError::ProofError {
            reason: "Proof was not generated from the provided source file".to_string(),
        });
    }
    
    // Check musical ratios match (with tolerance for floating point)
    let source_ratios: Vec<f64> = constraint_system.constraints
        .iter()
        .map(|c| c.ratio_f64)
        .collect();
        
    for (i, (&proof_ratio, &source_ratio)) in proof.metadata.musical_ratios
        .iter()
        .zip(source_ratios.iter())
        .enumerate() {
        if (proof_ratio - source_ratio).abs() > 0.001 {
            println!("  ❌ INTEGRITY VIOLATION: Musical ratio mismatch at index {}!", i);
            println!("     Source: {:.6}", source_ratio);
            println!("     Proof claims: {:.6}", proof_ratio);
            return Err(zyrkom::ZyrkomError::ProofError {
                reason: "Proof musical ratios don't match source file".to_string(),
            });
        }
    }

    println!("  ✅ Integrity checks PASSED - proof matches source");

    // Create verifier with TRUSTED constraint system from source
    let verifier = zyrkom::ZyrkomVerifier::new(constraint_system)?;
    let is_valid = verifier.verify(&proof)?;
    
    if is_valid {
        println!("  ✅ STARK proof verification PASSED");
        println!("  🔒 Proof cryptographically validates source constraints");
    } else {
        println!("  ❌ STARK proof verification FAILED");
        return Err(zyrkom::ZyrkomError::ProofError {
            reason: "STARK proof verification failed".to_string(),
        });
    }
    
    println!("✅ Verification complete - proof is valid and matches source");
    Ok(())
}

fn handle_shell() -> Result<()> {
    println!("🎼 Zyrkom Interactive Shell");
    println!("Enter musical DSL statements (type 'exit' to quit):");
    println!("Examples:");
    println!("  interval fifth = C4 -> G4");
    println!("  chord C_major = C4 + E4 + G4");
    println!("  note A4 = 440.0");
    println!("Save files with .zyrkom extension!");
    println!();
    
    let parser = ZyrkomParser::new();
    
    loop {
        print!("zyrkom> ");
        std::io::Write::flush(&mut std::io::stdout()).unwrap();
        
        let mut input = String::new();
        std::io::stdin().read_line(&mut input).unwrap();
        let input = input.trim();
        
        if input == "exit" || input == "quit" {
            println!("Goodbye! 🎵");
            break;
        }
        
        if input.is_empty() {
            continue;
        }
        
        match parser.parse(input) {
            Ok(elements) => {
                for element in &elements {
                    println!("  ✅ Parsed: {} ({})", element.name(), get_element_type(element));
                    
                    match element.to_constraints() {
                        Ok(constraints) => {
                            if !constraints.is_empty() {
                                println!("  ⚡ Generated {} ZK constraints", constraints.len());
                            }
                        }
                        Err(e) => {
                            println!("  ⚠️ Constraint generation failed: {}", e);
                        }
                    }
                }
            }
            Err(e) => {
                println!("  ❌ Parse error: {}", e);
            }
        }
        
        println!();
    }
    
    Ok(())
}

fn get_element_type(element: &zyrkom::ParsedElement) -> &'static str {
    match element {
        zyrkom::ParsedElement::Interval { .. } => "interval",
        zyrkom::ParsedElement::Chord { .. } => "chord",
        zyrkom::ParsedElement::Note { .. } => "note",
        zyrkom::ParsedElement::Constraint { .. } => "constraint",
    }
}
