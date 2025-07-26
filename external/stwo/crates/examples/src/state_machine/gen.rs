use itertools::Itertools;
use num_traits::{One, Zero};
use stwo::core::fields::m31::M31;
use stwo::core::fields::qm31::QM31;
use stwo::core::poly::circle::CanonicCoset;
use stwo::core::utils::{bit_reverse_index, coset_index_to_circle_domain_index};
use stwo::core::ColumnVec;
use stwo::prover::backend::simd::column::BaseColumn;
use stwo::prover::backend::simd::m31::{PackedM31, LOG_N_LANES};
use stwo::prover::backend::simd::qm31::PackedQM31;
use stwo::prover::backend::simd::SimdBackend;
use stwo::prover::poly::circle::CircleEvaluation;
use stwo::prover::poly::BitReversedOrder;
use stwo_constraint_framework::{LogupTraceGenerator, Relation};

use super::components::{State, StateMachineElements, STATE_SIZE};

// Given `initial state`, generate a trace that row `i` is the initial state plus `i` in the
// `inc_index` dimension.
// E.g. [x, y] -> [x, y + 1] -> [x, y + 2] -> [x, y + 1 << log_size].
pub fn gen_trace(
    log_size: u32,
    initial_state: State,
    inc_index: usize,
) -> ColumnVec<CircleEvaluation<SimdBackend, M31, BitReversedOrder>> {
    let domain = CanonicCoset::new(log_size).circle_domain();
    let mut trace = (0..STATE_SIZE)
        .map(|_| vec![M31::zero(); 1 << log_size])
        .collect_vec();
    let mut curr_state = initial_state;

    // Add the states in bit reversed circle domain order.
    for i in 0..1 << log_size {
        for j in 0..STATE_SIZE {
            let bit_rev_index =
                bit_reverse_index(coset_index_to_circle_domain_index(i, log_size), log_size);
            trace[j][bit_rev_index] = curr_state[j];
        }
        // Increment the state to the next state row.
        curr_state[inc_index] += M31::one();
    }

    trace
        .into_iter()
        .map(|col| {
            CircleEvaluation::<SimdBackend, _, BitReversedOrder>::new(
                domain,
                BaseColumn::from_iter(col),
            )
        })
        .collect_vec()
}

pub fn gen_interaction_trace(
    trace: &ColumnVec<CircleEvaluation<SimdBackend, M31, BitReversedOrder>>,
    inc_index: usize,
    lookup_elements: &StateMachineElements,
) -> (
    ColumnVec<CircleEvaluation<SimdBackend, M31, BitReversedOrder>>,
    QM31,
) {
    let log_size = trace[0].domain.log_size();

    let ones = PackedM31::broadcast(M31::one());
    let mut logup_gen = LogupTraceGenerator::new(log_size);
    let mut col_gen = logup_gen.new_col();

    for vec_row in 0..(1 << (log_size - LOG_N_LANES)) {
        let mut packed_state: [PackedM31; STATE_SIZE] = trace
            .iter()
            .map(|col| col.data[vec_row])
            .collect_vec()
            .try_into()
            .unwrap();
        let input_denom: PackedQM31 = lookup_elements.combine(&packed_state);
        packed_state[inc_index] += ones;
        let output_denom: PackedQM31 = lookup_elements.combine(&packed_state);
        col_gen.write_frac(
            vec_row,
            output_denom - input_denom,
            input_denom * output_denom,
        );
    }
    col_gen.finalize_col();

    logup_gen.finalize_last()
}

#[cfg(test)]
mod tests {
    use stwo::core::fields::m31::M31;
    use stwo::core::fields::qm31::{QM31, SECURE_EXTENSION_DEGREE};
    use stwo::core::fields::FieldExpOps;
    use stwo::core::utils::{bit_reverse_index, coset_index_to_circle_domain_index};
    use stwo::prover::backend::Column;
    use stwo_constraint_framework::Relation;

    use crate::state_machine::components::StateMachineElements;
    use crate::state_machine::gen::{gen_interaction_trace, gen_trace};

    #[test]
    fn test_gen_trace() {
        let log_size = 8;
        let initial_state = [M31::from_u32_unchecked(17), M31::from_u32_unchecked(16)];
        let inc_index = 1;
        let row = 123;
        let bit_rev_row =
            bit_reverse_index(coset_index_to_circle_domain_index(row, log_size), log_size);

        let trace = gen_trace(log_size, initial_state, inc_index);

        assert_eq!(trace.len(), 2);
        assert_eq!(trace[0].at(row), initial_state[0]);
        assert_eq!(
            trace[1].at(bit_rev_row),
            initial_state[1] + M31::from_u32_unchecked(row as u32)
        );
    }

    #[test]
    fn test_gen_interaction_trace() {
        let log_size = 8;
        let inc_index = 1;
        // Prepare the first and the last states.
        let first_state = [M31::from_u32_unchecked(17), M31::from_u32_unchecked(12)];
        let mut last_state = first_state;
        last_state[inc_index] += M31::from_u32_unchecked(1 << log_size);

        let trace = gen_trace(log_size, first_state, inc_index);
        let lookup_elements = StateMachineElements::dummy();
        let first_state_comb: QM31 = lookup_elements.combine(&first_state);
        let last_state_comb: QM31 = lookup_elements.combine(&last_state);

        let (interaction_trace, claimed_sum) =
            gen_interaction_trace(&trace, inc_index, &lookup_elements);

        assert_eq!(interaction_trace.len(), SECURE_EXTENSION_DEGREE); // One extension column.
        assert_eq!(
            claimed_sum,
            first_state_comb.inverse() - last_state_comb.inverse()
        );
    }
}
