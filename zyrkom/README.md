# 🎼 Zyrkom Core - Zero-Knowledge Musical Physics Engine

[![Rust](https://img.shields.io/badge/rust-1.88.0--nightly-orange.svg)](https://www.rust-lang.org)
[![Circle STARKs](https://img.shields.io/badge/backend-Stwo-blue.svg)](https://github.com/starkware-libs/stwo)
[![Tests](https://img.shields.io/badge/tests-47%20passing-green.svg)](#testing)

**The core Rust implementation of Zyrkom's physics-based ZK proof system.**

## 🚀 Features

### **Musical Physics Engine**
- Immutable physical constants (Perfect Fifth 3:2, Octave 2:1, etc.)
- Type-safe musical intervals and chords
- Harmonic validation based on acoustic physics
- Audio synthesis for constraint verification

### **Zero-Knowledge Components**
- **Circle STARK Integration**: Full Stwo framework implementation
- **M31 Field Arithmetic**: Optimized for Circle STARKs
- **Constraint Generation**: Automatic from musical physics
- **Component Trait**: Official Stwo pattern compliance

### **Advanced Capabilities**
- **Proof Aggregation**: Combine multiple proofs efficiently
- **Proof Compression**: Smart gzip optimization (60-80% reduction)
- **Proof Versioning**: Semantic versioning for migrations
- **Proof Splitting**: Template-affinity based chunking

### **Cairo Bridge**
- **M31 ↔ felt252 Conversion**: Bidirectional field element mapping
- **Gas Optimization**: 74% reduction on Starknet
- **Batch Processing**: Efficient constraint batching

## 📦 Installation

### As a Binary (CLI Tool)

```bash
# Install globally
cargo install --path .

# Or build locally
cargo build --release
```

### As a Library

```toml
[dependencies]
zyrkom = { path = "../zyrkom" }
```

## 🎵 CLI Usage

The Zyrkom CLI provides a beautiful interface for proof generation:

```bash
# Generate proof from interval
zyrkom interval C4 G4 --compress

# Generate proof from chord  
zyrkom chord C-major --output proof.zkp

# Verify proof
zyrkom verify proof.zkp

# Get proof information
zyrkom info proof.zkp --verbose

# Benchmark performance
zyrkom benchmark chord --iterations 100
```

### CLI Features
- 🎨 **Colored Output**: Beautiful terminal interface
- 📊 **Progress Bars**: Visual feedback for operations
- 🔐 **Compression**: Automatic smart compression
- 📝 **JSON Export**: Circom-compatible format
- ⚡ **Performance**: Optimized for speed

## 🧪 Testing

### Run All Tests
```bash
cargo test
# 47 tests passing
```

### Test Categories
```bash
# Musical physics
cargo test musical::physics

# ZK constraints
cargo test zk::constraints

# Proof generation
cargo test zk::stark

# Aggregation
cargo test test_proof_aggregation

# Component tests
cargo test zk::component
```

### Audio Tests (Optional)
```bash
# Requires audio hardware
cargo test --features test-audio -- --nocapture
```

## 🏗️ Architecture

### Module Structure
```
src/
├── musical/           # Physics engine
│   ├── mod.rs        # Musical types
│   └── physics.rs    # Harmonic calculations
├── zk/               # Zero-knowledge components
│   ├── stark.rs      # Prover & verifier
│   ├── component.rs  # Stwo integration
│   ├── constraints.rs # Constraint system
│   └── proof_splitting_algorithm.rs
├── bridge/           # Cairo integration
│   └── m31_felt252_converter.rs
├── dsl/              # Domain-specific language
│   └── parser.rs     # DSL compiler
├── bin/              # CLI applications
│   └── zyrkom.rs     # Main CLI tool
└── lib.rs            # Library interface
```

### Key Types

```rust
// Musical primitives
pub struct MusicalNote { frequency: f64 }
pub struct MusicalInterval { ratio: f64, cents: f64 }
pub struct Chord { notes: Vec<MusicalNote> }

// ZK components
pub struct ZyrkomProver { constraint_system: ConstraintSystem }
pub struct MusicalProof { 
    constraints: Vec<MusicalConstraint>,
    proof_data: Vec<u8>,
    metadata: ProofMetadata,
    version: ProofVersion
}

// Constraint types
pub enum ConstraintType {
    Harmonic,
    Octave,
    Consonance,
    Tuning
}
```

## ⚡ Performance

### Benchmarks
```bash
cargo bench
```

Results on M1 Max:
- **Interval Proof**: ~50ms
- **Chord Proof**: ~300ms
- **Verification**: ~30ms
- **Aggregation (10 proofs)**: ~500ms

### Optimizations
- **Zero-Copy**: Minimal allocations
- **SIMD**: Vectorized operations where possible
- **Pre-allocation**: Known-size vectors
- **Const Evaluation**: Compile-time physics

## 🔬 Mathematical Foundation

### Musical Physics Constants
```rust
pub const PERFECT_FIFTH_RATIO: f64 = 1.5;           // 3:2
pub const OCTAVE_RATIO: f64 = 2.0;                  // 2:1
pub const MAJOR_THIRD_RATIO: f64 = 1.25;            // 5:4
pub const PERFECT_FOURTH_RATIO: f64 = 1.333...;     // 4:3
pub const SEMITONE_RATIO: f64 = 1.0594630943592953; // 2^(1/12)
```

These ratios are **universal constants** - they don't change across cultures, time, or implementation.

### Constraint Generation
```rust
// Physics determines constraints automatically
let interval = MusicalInterval::perfect_fifth();
let constraints = interval.to_constraints()?;
// Generates ~7 mathematical constraints proving the 3:2 ratio
```

## 📊 Proof Format

### Binary Format (.zkp)
```
[Magic: 4 bytes]["ZKRM"]
[Version: 3 bytes][1.0.0]
[Compressed: 1 byte][0x01]
[Data: N bytes][gzipped proof data]
```

### JSON Format (.json)
```json
{
  "version": "1.0.0",
  "timestamp": 1738093200,
  "structure_type": "chord",
  "constraint_count": 21,
  "musical_ratios": [1.0, 1.25, 1.5],
  "proof_data": "base64...",
  "metadata": {
    "notes": ["C4", "E4", "G4"],
    "fundamental": 261.63
  }
}
```

## 🛠️ Development

### Code Standards
See `.cursor/rules/zyrkom_rust.mdc` for detailed standards:
- **Performance Critical**: Zero-copy, SIMD where possible
- **No Panics**: All errors handled properly
- **Physics Immutability**: Constants are compile-time
- **Type Safety**: Musical relationships at compile-time

### Building
```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# Run clippy
cargo clippy --all-targets

# Format code
cargo fmt
```

## 📚 Dependencies

### Core
- `stwo` - Circle STARK framework
- `stwo-prover` - Proof generation

### Serialization
- `serde` - Serialization framework
- `bincode` - Binary encoding
- `flate2` - Gzip compression

### Utilities
- `clap` - CLI argument parsing
- `colored` - Terminal colors
- `chrono` - Timestamps
- `thiserror` - Error handling

## 🌐 Starknet Deployment

### **Cairo Contracts**
- **Physics Template Storage**: `0x03de6877fef83b3cb1e240bdd1b4700ff2d595e1551563591480d3fc5ab6c300`
- **PoC Template Storage**: `0x0792d8510f5a9d3fa3450a7f1dd27ccec71506754b3d98567e9f49daba40f6b3`
- **Network**: Starknet Sepolia Testnet

### **Gas Benchmarks**
- **store_template**: ~1,291,200 L2 gas
- **validate_template**: ~1,040,960 L2 gas  
- **Gas reduction**: 74% vs pure verification

## 📄 License

**Zyrkom Restricted Commercial License (ZRCL) v1.0**

- **Open Source**: Free for non-commercial use, research, and contributions  
- **Commercial Restriction**: Monetization rights reserved exclusively to ZyraV21
- **Dual Licensing**: Commercial licenses available for businesses

See [LICENSE-ZYRKOM](../LICENSE-ZYRKOM) for complete terms.

---

**Zyrkom Core: Where Physics Becomes Cryptography** 🎵🔐