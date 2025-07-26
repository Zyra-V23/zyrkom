use criterion::{black_box, criterion_group, criterion_main, Criterion};
use zyrkom::musical::{MusicalInterval, MusicalNote, Chord};

fn bench_interval_creation(c: &mut Criterion) {
    c.bench_function("perfect_fifth_creation", |b| {
        b.iter(|| {
            black_box(MusicalInterval::perfect_fifth())
        })
    });
    
    c.bench_function("major_third_creation", |b| {
        b.iter(|| {
            black_box(MusicalInterval::major_third())
        })
    });
}

fn bench_chord_creation(c: &mut Criterion) {
    c.bench_function("major_triad_creation", |b| {
        let root = MusicalNote::from_midi(60); // C4
        b.iter(|| {
            black_box(Chord::major_triad(black_box(root)))
        })
    });
}

fn bench_interval_operations(c: &mut Criterion) {
    let fifth = MusicalInterval::perfect_fifth();
    let fourth = MusicalInterval::perfect_fourth();
    
    c.bench_function("interval_combination", |b| {
        b.iter(|| {
            black_box(black_box(fifth).combine(black_box(&fourth)))
        })
    });
    
    c.bench_function("interval_inversion", |b| {
        b.iter(|| {
            black_box(black_box(fifth).invert())
        })
    });
}

criterion_group!(
    benches,
    bench_interval_creation,
    bench_chord_creation,
    bench_interval_operations
);
criterion_main!(benches); 