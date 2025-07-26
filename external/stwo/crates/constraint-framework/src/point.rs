use core::ops::Mul;

use std_shims::{vec, Vec};
use stwo::core::air::accumulation::PointEvaluationAccumulator;
use stwo::core::fields::qm31::{SecureField, SECURE_EXTENSION_DEGREE};
use stwo::core::pcs::TreeVec;
use stwo::core::{ColumnVec, Fraction};

use super::logup::LogupAtRow;
use super::{EvalAtRow, INTERACTION_TRACE_IDX};

/// Evaluates expressions at a point out of domain.
pub struct PointEvaluator<'a> {
    pub mask: TreeVec<ColumnVec<&'a Vec<SecureField>>>,
    pub evaluation_accumulator: &'a mut PointEvaluationAccumulator,
    pub col_index: Vec<usize>,
    pub denom_inverse: SecureField,
    pub logup: LogupAtRow<Self>,
}
impl<'a> PointEvaluator<'a> {
    pub fn new(
        mask: TreeVec<ColumnVec<&'a Vec<SecureField>>>,
        evaluation_accumulator: &'a mut PointEvaluationAccumulator,
        denom_inverse: SecureField,
        log_size: u32,
        claimed_sum: SecureField,
    ) -> Self {
        let col_index = vec![0; mask.len()];
        Self {
            mask,
            evaluation_accumulator,
            col_index,
            denom_inverse,
            logup: LogupAtRow::new(INTERACTION_TRACE_IDX, claimed_sum, log_size),
        }
    }
}
impl EvalAtRow for PointEvaluator<'_> {
    type F = SecureField;
    type EF = SecureField;

    fn next_interaction_mask<const N: usize>(
        &mut self,
        interaction: usize,
        _offsets: [isize; N],
    ) -> [Self::F; N] {
        let col_index = self.col_index[interaction];
        self.col_index[interaction] += 1;
        let mask = self.mask[interaction][col_index].clone();
        assert_eq!(mask.len(), N);
        mask.try_into().unwrap()
    }
    fn add_constraint<G>(&mut self, constraint: G)
    where
        Self::EF: Mul<G, Output = Self::EF>,
    {
        self.evaluation_accumulator
            .accumulate(self.denom_inverse * constraint);
    }
    fn combine_ef(values: [Self::F; SECURE_EXTENSION_DEGREE]) -> Self::EF {
        SecureField::from_partial_evals(values)
    }

    super::logup_proxy!();
}
