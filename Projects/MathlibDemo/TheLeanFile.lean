import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

theorem pluss_comm {a b} : pluss a b = pluss b a := by
  have h : 1 + 999 + 2 = 1002 := by native_decide
  repeat rw [pluss]
  repeat rw [h]
  rw [Nat.add_comm a b]