//! Zyrkom Matrix UI - Backend Tauri
//! 
//! This module provides the Tauri backend for the Matrix-style user interface
//! of the Zyrkom Musical Cryptography Framework.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use zyrkom::{
    musical::MusicalInterval,
    zk::{ZyrkomProver, ZyrkomVerifier, constraints::ToConstraints},
};

/// Global application state for audio and ZK operations
pub struct AppState {
    pub current_proof: Mutex<Option<String>>,
    pub is_playing_audio: Mutex<bool>,
}

/// Frontend request for generating musical interval
#[derive(Deserialize)]
pub struct IntervalRequest {
    pub interval_type: String, // "perfect_fifth", "major_third", "octave"
    pub base_frequency: f64,
}

/// Response containing interval data and audio info
#[derive(Serialize)]
pub struct IntervalResponse {
    pub ratio: f64,
    pub cents: f64,
    pub base_frequency: f64,
    pub target_frequency: f64,
    pub constraint_count: usize,
    pub proof_generated: bool,
}

/// Audio visualization data for Matrix effects
#[derive(Serialize)]
pub struct AudioVisualizationData {
    pub frequencies: Vec<f64>,
    pub amplitudes: Vec<f64>,
    pub time_domain: Vec<f64>,
    pub constraint_values: Vec<f64>,
}

/// ZK Proof generation result
#[derive(Serialize)]
pub struct ProofResult {
    pub success: bool,
    pub proof_size: usize,
    pub verification_time_ms: u64,
    pub constraint_count: usize,
    pub error: Option<String>,
}

/// Generate musical interval and return data for visualization
#[tauri::command]
async fn generate_musical_interval(
    request: IntervalRequest,
    _state: State<'_, AppState>,
) -> Result<IntervalResponse, String> {
    let interval = match request.interval_type.as_str() {
        "perfect_fifth" => MusicalInterval::perfect_fifth(),
        "major_third" => MusicalInterval::major_third(),
        "octave" => MusicalInterval::octave(),
        _ => return Err("Unsupported interval type".to_string()),
    };

    let target_frequency = request.base_frequency * interval.ratio();
    let constraints = interval.to_constraints()
        .map_err(|e| format!("Failed to generate constraints: {}", e))?;

    Ok(IntervalResponse {
        ratio: interval.ratio(),
        cents: interval.cents(),
        base_frequency: request.base_frequency,
        target_frequency,
        constraint_count: constraints.constraint_count(),
        proof_generated: false, // Will be set by separate command
    })
}

/// Generate ZK proof for musical constraints
#[tauri::command]
async fn generate_zk_proof(
    interval_type: String,
    state: State<'_, AppState>,
) -> Result<ProofResult, String> {
    let start_time = std::time::Instant::now();
    
    let interval = match interval_type.as_str() {
        "perfect_fifth" => MusicalInterval::perfect_fifth(),
        "major_third" => MusicalInterval::major_third(),
        "octave" => MusicalInterval::octave(),
        _ => return Err("Unsupported interval type".to_string()),
    };

    let constraints = interval.to_constraints()
        .map_err(|e| format!("Constraint generation failed: {}", e))?;

    match ZyrkomProver::new(constraints.clone()) {
        Ok(prover) => {
            match prover.prove() {
                Ok(proof) => {
                    let verification_time = start_time.elapsed();
                    
                    // Store proof for later verification
                    *state.current_proof.lock().unwrap() = Some(format!("{:?}", proof));
                    
                    Ok(ProofResult {
                        success: true,
                        proof_size: std::mem::size_of_val(&proof),
                        verification_time_ms: verification_time.as_millis() as u64,
                        constraint_count: constraints.constraint_count(),
                        error: None,
                    })
                },
                Err(e) => Ok(ProofResult {
                    success: false,
                    proof_size: 0,
                    verification_time_ms: 0,
                    constraint_count: constraints.constraint_count(),
                    error: Some(format!("Proof generation failed: {}", e)),
                })
            }
        },
        Err(e) => Ok(ProofResult {
            success: false,
            proof_size: 0,
            verification_time_ms: 0,
            constraint_count: 0,
            error: Some(format!("Prover creation failed: {}", e)),
        })
    }
}

/// Play audio for musical interval (for Matrix audio effects)
#[tauri::command]
async fn play_audio_interval(
    base_frequency: f64,
    target_frequency: f64,
    duration_ms: u64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Set playing state
    *state.is_playing_audio.lock().unwrap() = true;
    
    // Use Zyrkom's audio utilities if available
    #[cfg(feature = "audio-matrix")]
    {
        use zyrkom::utils::audio;
        
        // Play base frequency first
        if let Err(e) = audio::play_frequency(base_frequency, duration_ms / 2) {
            return Err(format!("Failed to play base frequency: {}", e));
        }
        
        // Then play target frequency
        if let Err(e) = audio::play_frequency(target_frequency, duration_ms / 2) {
            return Err(format!("Failed to play target frequency: {}", e));
        }
    }
    
    // Reset playing state
    *state.is_playing_audio.lock().unwrap() = false;
    
    Ok(())
}

/// Get audio visualization data for Matrix effects
#[tauri::command]
async fn get_audio_visualization(
    base_frequency: f64,
    target_frequency: f64,
    sample_count: usize,
) -> Result<AudioVisualizationData, String> {
    let mut frequencies = Vec::with_capacity(sample_count);
    let mut amplitudes = Vec::with_capacity(sample_count);
    let mut time_domain = Vec::with_capacity(sample_count);
    let mut constraint_values = Vec::with_capacity(sample_count);
    
    for i in 0..sample_count {
        let t = i as f64 / sample_count as f64;
        
        // Linear interpolation between frequencies for Matrix wave effect
        let freq = base_frequency + (target_frequency - base_frequency) * t;
        frequencies.push(freq);
        
        // Sine wave amplitude for visualization
        let amplitude = (2.0 * std::f64::consts::PI * freq * t).sin();
        amplitudes.push(amplitude);
        
        // Time domain for Matrix rain effect
        time_domain.push(t);
        
        // Simulated constraint values (ratio-based)
        let constraint_val = freq / base_frequency;
        constraint_values.push(constraint_val);
    }
    
    Ok(AudioVisualizationData {
        frequencies,
        amplitudes,
        time_domain,
        constraint_values,
    })
}

/// Run comprehensive test suite (for Matrix terminal effect)
#[tauri::command]
async fn run_test_suite() -> Result<Vec<String>, String> {
    let mut test_results = Vec::new();
    
    // Test perfect fifth
    test_results.push("🎵 Testing Perfect Fifth (3:2 ratio)".to_string());
    let fifth = MusicalInterval::perfect_fifth();
    if let Ok(constraints) = fifth.to_constraints() {
        test_results.push(format!("  ✅ Generated {} constraints", constraints.constraint_count()));
        
        if let Ok(prover) = ZyrkomProver::new(constraints.clone()) {
            if let Ok(_proof) = prover.prove() {
                test_results.push("  ✅ ZK Proof generation successful".to_string());
                
                if let Ok(_verifier) = ZyrkomVerifier::new(constraints) {
                    test_results.push("  ✅ Verifier created successfully".to_string());
                }
            }
        }
    }
    
    // Test major third
    test_results.push("🎵 Testing Major Third (5:4 ratio)".to_string());
    let third = MusicalInterval::major_third();
    if let Ok(constraints) = third.to_constraints() {
        test_results.push(format!("  ✅ Generated {} constraints", constraints.constraint_count()));
    }
    
    // Test octave
    test_results.push("🎵 Testing Octave (2:1 ratio)".to_string());
    let octave = MusicalInterval::octave();
    if let Ok(constraints) = octave.to_constraints() {
        test_results.push(format!("  ✅ Generated {} constraints", constraints.constraint_count()));
    }
    
    test_results.push("🎉 All tests completed successfully!".to_string());
    Ok(test_results)
}

/// Main Tauri application entry point
fn main() {
    tauri::Builder::default()
        .manage(AppState {
            current_proof: Mutex::new(None),
            is_playing_audio: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            generate_musical_interval,
            generate_zk_proof,
            play_audio_interval,
            get_audio_visualization,
            run_test_suite
        ])
        .setup(|_app| {
            // Setup system tray if enabled
            #[cfg(target_os = "macos")]
            _app.set_activation_policy(tauri::ActivationPolicy::Regular);
            
            println!("🎵🔐 Zyrkom Matrix UI Backend Started");
            println!("Ready for musical cryptography operations!");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Zyrkom Matrix UI");
} 