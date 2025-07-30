//! Zyrkom DSL Parser
//! 
//! This module provides parsing capabilities for the Zyrkom musical domain-specific language.
//! Currently implements basic placeholder functionality for DSL compilation.


use crate::zk::constraints::{ConstraintSystem, MusicalConstraint, ConstraintType};
use crate::{ZyrkomError};

/// Main parser for Zyrkom DSL
#[derive(Debug, Clone)]
pub struct ZyrkomParser {
    // Using empty struct for now - future versions will add parsing state
}

/// Parsed elements from the DSL
#[derive(Debug, Clone, PartialEq)]
pub enum ParsedElement {
    /// A musical note definition
    Note { 
        /// Name of the note (e.g., "C4", "A440")
        name: String, 
        /// Frequency in Hz
        frequency: f64 
    },
    /// A chord definition
    Chord { 
        /// Name of the chord (e.g., "C_major", "Dm7")
        name: String, 
        /// List of note names in the chord
        notes: Vec<String> 
    },
    /// An interval definition  
    Interval { 
        /// Name of the interval (e.g., "perfect_fifth", "major_third")
        name: String, 
        /// Frequency ratio (e.g., 1.5 for perfect fifth)
        ratio: f64 
    },
    /// A constraint definition
    Constraint { 
        /// Name of the constraint (e.g., "harmonic_validation")
        name: String, 
        /// Mathematical expression for the constraint
        expression: String 
    },
}

impl ZyrkomParser {
    /// Create a new parser instance
    pub fn new() -> Self {
        Self {
        }
    }

    /// Parse a string of Zyrkom DSL code
    pub fn parse(&mut self, input: &str) -> Result<Vec<ParsedElement>, ParseError> {
        self.parse_multiple(input)
    }

    /// Parse multiple elements from Zyrkom DSL code (alias for parse)
    pub fn parse_multiple(&mut self, input: &str) -> Result<Vec<ParsedElement>, ParseError> {
        // Basic placeholder implementation
        // TODO: Implement full DSL parsing with LALRPOP or Tree-sitter
        
        let lines: Vec<&str> = input.lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty() && !line.starts_with("//"))
            .collect();

        let mut elements = Vec::new();

        for line in lines {
            if let Some(element) = self.parse_line(line)? {
                elements.push(element);
            }
        }

        Ok(elements)
    }

    /// Parse a single line of DSL code
    fn parse_line(&mut self, line: &str) -> Result<Option<ParsedElement>, ParseError> {
        // Simple pattern matching for basic DSL elements
        
        if line.starts_with("note ") {
            self.parse_note(line)
        } else if line.starts_with("chord ") {
            self.parse_chord(line)
        } else if line.starts_with("interval ") {
            self.parse_interval(line)
        } else if line.starts_with("constraint ") {
            self.parse_constraint(line)
        } else {
            // Unknown syntax - for now just ignore
            Ok(None)
        }
    }

    fn parse_note(&self, line: &str) -> Result<Option<ParsedElement>, ParseError> {
        // Example: "note C4 = 261.63"
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Err(ParseError::InvalidSyntax(line.to_string()));
        }

        let name = parts[0].trim().strip_prefix("note ").unwrap_or("").trim();
        let freq_str = parts[1].trim();
        
        let frequency = freq_str.parse::<f64>()
            .map_err(|_| ParseError::InvalidFrequency(freq_str.to_string()))?;

        Ok(Some(ParsedElement::Note {
            name: name.to_string(),
            frequency,
        }))
    }

    fn parse_chord(&self, line: &str) -> Result<Option<ParsedElement>, ParseError> {
        // Example: "chord C_major = C + E + G"
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Err(ParseError::InvalidSyntax(line.to_string()));
        }

        let name = parts[0].trim().strip_prefix("chord ").unwrap_or("").trim();
        let notes_str = parts[1].trim();
        
        let notes: Vec<String> = notes_str
            .split('+')
            .map(|note| note.trim().to_string())
            .collect();

        Ok(Some(ParsedElement::Chord {
            name: name.to_string(),
            notes,
        }))
    }

    fn parse_interval(&self, line: &str) -> Result<Option<ParsedElement>, ParseError> {
        // Example: "interval perfect_fifth = 1.5"
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Err(ParseError::InvalidSyntax(line.to_string()));
        }

        let name = parts[0].trim().strip_prefix("interval ").unwrap_or("").trim();
        let ratio_str = parts[1].trim();
        
        let ratio = ratio_str.parse::<f64>()
            .map_err(|_| ParseError::InvalidRatio(ratio_str.to_string()))?;

        Ok(Some(ParsedElement::Interval {
            name: name.to_string(),
            ratio,
        }))
    }

    fn parse_constraint(&self, line: &str) -> Result<Option<ParsedElement>, ParseError> {
        // Example: "constraint harmonic = freq1 / freq2 == ratio"
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Err(ParseError::InvalidSyntax(line.to_string()));
        }

        let name = parts[0].trim().strip_prefix("constraint ").unwrap_or("").trim();
        let expression = parts[1].trim();

        Ok(Some(ParsedElement::Constraint {
            name: name.to_string(),
            expression: expression.to_string(),
        }))
    }
}

impl Default for ZyrkomParser {
    fn default() -> Self {
        Self::new()
    }
}

/// Errors that can occur during DSL parsing
#[derive(Debug, Clone, PartialEq)]
pub enum ParseError {
    /// Invalid syntax in the DSL
    InvalidSyntax(String),
    /// Invalid frequency value
    InvalidFrequency(String),
    /// Invalid ratio value
    InvalidRatio(String),
    /// Undefined reference in the DSL
    UndefinedReference(String),
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::InvalidSyntax(line) => write!(f, "Invalid syntax: {}", line),
            ParseError::InvalidFrequency(freq) => write!(f, "Invalid frequency: {}", freq),
            ParseError::InvalidRatio(ratio) => write!(f, "Invalid ratio: {}", ratio),
            ParseError::UndefinedReference(name) => write!(f, "Undefined reference: {}", name),
        }
    }
}

impl std::error::Error for ParseError {}

// Convert ParseError to ZyrkomError
impl From<ParseError> for ZyrkomError {
    fn from(parse_error: ParseError) -> Self {
        match parse_error {
            ParseError::InvalidSyntax(line) => ZyrkomError::ParseError {
                message: format!("Invalid syntax: {}", line),
                line: 0, // TODO: Track actual line numbers
            },
            ParseError::InvalidFrequency(freq) => ZyrkomError::ParseError {
                message: format!("Invalid frequency: {}", freq),
                line: 0,
            },
            ParseError::InvalidRatio(ratio) => ZyrkomError::ParseError {
                message: format!("Invalid ratio: {}", ratio),
                line: 0,
            },
            ParseError::UndefinedReference(name) => ZyrkomError::ParseError {
                message: format!("Undefined reference: {}", name),
                line: 0,
            },
        }
    }
}

impl ParsedElement {
    /// Get the name of this parsed element
    pub fn name(&self) -> &str {
        match self {
            ParsedElement::Note { name, .. } => name,
            ParsedElement::Chord { name, .. } => name,
            ParsedElement::Interval { name, .. } => name,
            ParsedElement::Constraint { name, .. } => name,
        }
    }

    /// Convert this element to ZK constraints (placeholder implementation)
    pub fn to_constraints(&self) -> Result<ConstraintSystem, ParseError> {
        let mut system = ConstraintSystem::new();
        
        match self {
            ParsedElement::Note { frequency, .. } => {
                // Create a basic frequency validation constraint
                if let Ok(constraint) = MusicalConstraint::from_ratio(*frequency / 440.0, ConstraintType::HarmonicRatio) {
                    system.add_constraint(constraint);
                }
            },
            ParsedElement::Chord { notes, .. } => {
                // Create constraints for chord intervals
                for _ in notes {
                    if let Ok(constraint) = MusicalConstraint::from_ratio(1.5, ConstraintType::Consonance) {
                        system.add_constraint(constraint);
                    }
                }
            },
            ParsedElement::Interval { ratio, .. } => {
                // Create interval validation constraint
                if let Ok(constraint) = MusicalConstraint::from_ratio(*ratio, ConstraintType::Consonance) {
                    system.add_constraint(constraint);
                }
            },
            ParsedElement::Constraint { .. } => {
                // Create generic constraint - placeholder
                if let Ok(constraint) = MusicalConstraint::from_ratio(1.0, ConstraintType::TuningConsistency) {
                    system.add_constraint(constraint);
                }
            },
        }
        
        Ok(system)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_note() {
        let mut parser = ZyrkomParser::new();
        let result = parser.parse("note C4 = 261.63").unwrap();
        
        assert_eq!(result.len(), 1);
        match &result[0] {
            ParsedElement::Note { name, frequency } => {
                assert_eq!(name, "C4");
                assert_eq!(*frequency, 261.63);
            },
            _ => panic!("Expected Note element"),
        }
    }

    #[test]
    fn test_parse_chord() {
        let mut parser = ZyrkomParser::new();
        let result = parser.parse("chord C_major = C + E + G").unwrap();
        
        assert_eq!(result.len(), 1);
        match &result[0] {
            ParsedElement::Chord { name, notes } => {
                assert_eq!(name, "C_major");
                assert_eq!(notes, &vec!["C".to_string(), "E".to_string(), "G".to_string()]);
            },
            _ => panic!("Expected Chord element"),
        }
    }

    #[test]
    fn test_parse_interval() {
        let mut parser = ZyrkomParser::new();
        let result = parser.parse("interval perfect_fifth = 1.5").unwrap();
        
        assert_eq!(result.len(), 1);
        match &result[0] {
            ParsedElement::Interval { name, ratio } => {
                assert_eq!(name, "perfect_fifth");
                assert_eq!(*ratio, 1.5);
            },
            _ => panic!("Expected Interval element"),
        }
    }

    #[test]
    fn test_parse_multi_line() {
        let mut parser = ZyrkomParser::new();
        let dsl_code = r#"
            note C4 = 261.63
            note E4 = 329.63
            chord C_major = C + E + G
            interval perfect_fifth = 1.5
        "#;
        
        let result = parser.parse(dsl_code).unwrap();
        assert_eq!(result.len(), 4);
    }

    #[test]
    fn test_parse_with_comments() {
        let mut parser = ZyrkomParser::new();
        let dsl_code = r#"
            // This is a comment
            note C4 = 261.63
            // Another comment
            interval perfect_fifth = 1.5
        "#;
        
        let result = parser.parse(dsl_code).unwrap();
        assert_eq!(result.len(), 2); // Comments should be ignored
    }
} 