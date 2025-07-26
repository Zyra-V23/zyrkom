//! Zyrkom Domain Specific Language
//! 
//! This module contains the musical DSL compiler that converts
//! musical notation and theory into zero-knowledge constraints.

/// Musical DSL parser implementation
pub mod parser;

pub use parser::{ZyrkomParser, ParsedElement}; 