use criterion::{black_box, criterion_group, criterion_main, Criterion};
use zyrkom::musical::MusicalInterval;
use zyrkom::zk::{ZyrkomProver, ZyrkomComponent};
use zyrkom::zk::constraints::ToConstraints;
use stwo::core::air::Component; // For trace_log_degree_bounds method

fn bench_musical_interval_to_constraints(c: &mut Criterion) {
    c.bench_function("musical_interval_to_constraints", |b| {
        let perfect_fifth = MusicalInterval::perfect_fifth();
        b.iter(|| {
            black_box(perfect_fifth.to_constraints().unwrap())
        })
    });
}

fn bench_component_creation(c: &mut Criterion) {
    c.bench_function("zyrkom_component_creation", |b| {
        let perfect_fifth = MusicalInterval::perfect_fifth();
        let constraints = perfect_fifth.to_constraints().unwrap();
        b.iter(|| {
            black_box(ZyrkomComponent::new(black_box(constraints.clone())).unwrap())
        })
    });
}

fn bench_trace_bounds_calculation(c: &mut Criterion) {
    c.bench_function("trace_bounds_calculation", |b| {
        let perfect_fifth = MusicalInterval::perfect_fifth();
        let constraints = perfect_fifth.to_constraints().unwrap();
        let component = ZyrkomComponent::new(constraints).unwrap();
        b.iter(|| {
            black_box(component.trace_log_degree_bounds())
        })
    });
}

fn bench_constraint_system_validation(c: &mut Criterion) {
    c.bench_function("constraint_system_validation", |b| {
        let perfect_fifth = MusicalInterval::perfect_fifth();
        let constraints = perfect_fifth.to_constraints().unwrap();
        b.iter(|| {
            black_box(constraints.validate().unwrap())
        })
    });
}

fn bench_zk_proof_generation(c: &mut Criterion) {
    c.bench_function("zk_proof_generation", |b| {
        let perfect_fifth = MusicalInterval::perfect_fifth();
        let constraints = perfect_fifth.to_constraints().unwrap();
        let prover = ZyrkomProver::new(constraints).unwrap();
        b.iter(|| {
            // Note: This is expensive - consider running with fewer iterations
            black_box(prover.prove().unwrap())
        })
    });
}

criterion_group!(
    benches,
    bench_musical_interval_to_constraints,
    bench_component_creation,
    bench_trace_bounds_calculation,
    bench_constraint_system_validation,
    bench_zk_proof_generation
);
criterion_main!(benches); 