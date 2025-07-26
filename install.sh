#!/bin/bash

# 🎼 Zyrkom Auto-Install Script
# Makes the project completely plug-and-play

set -e

echo "🎼 Installing Zyrkom Zero-Knowledge Musical Physics Framework..."
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows (Git Bash)
check_platform() {
    print_step "Detecting platform..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "Platform: Windows (Git Bash)"
        PLATFORM="windows"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Platform: Linux"
        PLATFORM="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Platform: macOS"
        PLATFORM="macos"
    else
        print_warning "Unknown platform: $OSTYPE"
        PLATFORM="unknown"
    fi
}

# Install Rust
install_rust() {
    print_step "Checking Rust installation..."
    if command -v rustc &> /dev/null; then
        RUST_VERSION=$(rustc --version)
        print_success "Rust already installed: $RUST_VERSION"
    else
        print_step "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
        print_success "Rust installed successfully"
    fi

    # Ensure nightly toolchain
    print_step "Setting up Rust nightly..."
    rustup install nightly
    rustup default nightly
    print_success "Rust nightly configured"
}

# Install Node.js
install_nodejs() {
    print_step "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js already installed: $NODE_VERSION"
    else
        print_step "Installing Node.js..."
        if [[ "$PLATFORM" == "windows" ]]; then
            print_warning "Please install Node.js manually from https://nodejs.org"
            print_warning "Then run this script again."
            exit 1
        elif [[ "$PLATFORM" == "linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$PLATFORM" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                brew install node
            else
                print_warning "Please install Node.js manually from https://nodejs.org"
                exit 1
            fi
        fi
        print_success "Node.js installed successfully"
    fi
}

# Build Zyrkom core
build_zyrkom_core() {
    print_step "Building Zyrkom core engine..."
    cd zyrkom
    
    # Clean previous builds
    cargo clean
    
    # Run tests to verify everything works
    print_step "Running core tests..."
    cargo test --lib
    
    # Build in release mode
    print_step "Building release version..."
    cargo build --release
    
    cd ..
    print_success "Zyrkom core built successfully"
}

# Setup frontend
setup_frontend() {
    print_step "Setting up Matrix UI frontend..."
    cd zyrkom-ui
    
    # Install Node.js dependencies
    print_step "Installing Node.js dependencies..."
    npm install
    
    # Install Tauri CLI
    print_step "Installing Tauri CLI..."
    if command -v cargo-tauri &> /dev/null; then
        print_success "Tauri CLI already installed"
    else
        cargo install tauri-cli --version "^2.0"
        print_success "Tauri CLI installed"
    fi
    
    # Build frontend
    print_step "Building frontend..."
    npm run build
    
    cd ..
    print_success "Frontend setup complete"
}

# Test audio features
test_audio() {
    print_step "Testing audio capabilities..."
    cd zyrkom
    
    print_step "Running audio tests (you should hear musical intervals)..."
    print_warning "Make sure your speakers/headphones are on!"
    sleep 2
    
    # Run audio tests with feature flag
    cargo test --lib --features test-audio -- --nocapture || {
        print_warning "Audio tests failed, but core functionality should still work"
        print_warning "Audio might not be available on this system"
    }
    
    cd ..
}

# Create launch scripts
create_launch_scripts() {
    print_step "Creating launch scripts..."
    
    # Create development launch script
    cat > launch-dev.sh << 'EOF'
#!/bin/bash
echo "🎼 Launching Zyrkom Matrix UI (Development Mode)"
cd zyrkom-ui
npm run tauri dev
EOF
    chmod +x launch-dev.sh
    
    # Create production launch script  
    cat > launch-prod.sh << 'EOF'
#!/bin/bash
echo "🎼 Launching Zyrkom Matrix UI (Production Mode)"
cd zyrkom-ui
npm run tauri build
echo "Build complete! Check zyrkom-ui/src-tauri/target/release/ for the executable"
EOF
    chmod +x launch-prod.sh
    
    # Create test script
    cat > run-tests.sh << 'EOF'
#!/bin/bash
echo "🧪 Running all Zyrkom tests..."
cd zyrkom
echo "Running core tests..."
cargo test --lib
echo "Running audio tests (with sound)..."
cargo test --lib --features test-audio -- --nocapture
echo "Running benchmarks..."
cargo bench
EOF
    chmod +x run-tests.sh
    
    print_success "Launch scripts created: launch-dev.sh, launch-prod.sh, run-tests.sh"
}

# Final verification
verify_installation() {
    print_step "Verifying installation..."
    
    # Check if all binaries exist
    command -v rustc &> /dev/null || { print_error "Rust not found"; exit 1; }
    command -v node &> /dev/null || { print_error "Node.js not found"; exit 1; }
    command -v npm &> /dev/null || { print_error "npm not found"; exit 1; }
    
    # Check if Zyrkom builds
    cd zyrkom
    cargo check &> /dev/null || { print_error "Zyrkom core doesn't compile"; exit 1; }
    cd ..
    
    # Check if frontend builds
    cd zyrkom-ui
    npm run build &> /dev/null || { print_error "Frontend doesn't build"; exit 1; }
    cd ..
    
    print_success "All verification checks passed!"
}

# Print final instructions
print_final_instructions() {
    echo ""
    echo "🎉 INSTALLATION COMPLETE!"
    echo "========================"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "  ./launch-dev.sh      # Start Matrix UI (development)"
    echo "  ./launch-prod.sh     # Build production version"
    echo "  ./run-tests.sh       # Run all tests with audio"
    echo ""
    echo "🎵 What you can do now:"
    echo "  1. Run './launch-dev.sh' to see the Matrix-style UI"
    echo "  2. Run './run-tests.sh' to hear ZK proofs as audio"
    echo "  3. Edit files in zyrkom/src/ for core engine changes"
    echo "  4. Edit files in zyrkom-ui/src/ for UI changes"
    echo ""
    echo "📚 Directories:"
    echo "  zyrkom/          # Core Rust engine"
    echo "  zyrkom-ui/       # Matrix-style frontend"
    echo "  docs/            # Documentation & whitepapers"
    echo "  research/        # Research logs"
    echo ""
    echo "🎼 Happy zero-knowledge musical proving!"
}

# Main installation flow
main() {
    check_platform
    install_rust
    install_nodejs
    build_zyrkom_core
    setup_frontend
    test_audio
    create_launch_scripts
    verify_installation
    print_final_instructions
}

# Error handling
trap 'print_error "Installation failed at step: $BASH_COMMAND"' ERR

# Run main installation
main "$@" 