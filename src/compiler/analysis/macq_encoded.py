
from nnf import Var, And, Or
from nnf.kissat import solve

from encoding import gen_lookup, lookup, make_constraints, make_method_constraint

x1 = Var('Learning Parameters > Agent Features > Rationality > Causally Rational')
x2 = Var('Learning Parameters > Agent Features > Rationality > Optimally Rational')
x3 = Var('Learning Parameters > Model Features > Uncertainty > Deterministic')
x4 = Var('Learning Parameters > Model Features > Uncertainty > Non-deterministic')
x5 = Var('Learning Parameters > Model Features > Uncertainty > Probabilistic')
x6 = Var('Learning Parameters > Model Features > Actions > Parameterized')
x7 = Var('Learning Parameters > Model Features > Actions > Typing')
x8 = Var('Learning Parameters > Model Features > Actions > Macros')
x9 = Var('Learning Parameters > Model Features > Actions > Cost')
x10 = Var('Learning Parameters > Model Features > Predicates > Parameterized')
x11 = Var('Learning Parameters > Model Features > Predicates > Parameters Typed')
x12 = Var('Learning Parameters > Data Features > Fluent Observability > Fully Observable')
x13 = Var('Learning Parameters > Data Features > Fluent Observability > Partially Observable')
x14 = Var('Learning Parameters > Data Features > Fluent Observability > Unobservable')
x15 = Var('Learning Parameters > Data Features > Fluent Observability > Noise')
x16 = Var('Learning Parameters > Data Features > Predicate Information > Parameterized')
x17 = Var('Learning Parameters > Data Features > Predicate Information > Typing')
x18 = Var('Learning Parameters > Data Features > Action Information > Parameterized')
x19 = Var('Learning Parameters > Data Features > Action Information > Typing')
x20 = Var('Learning Parameters > Data Features > Action Information > Noise')
x21 = Var('Learning Parameters > Data Features > Action Information > Action Labels Known')
x22 = Var('Learning Parameters > Data Features > Action Information > Parameters Known')
x23 = Var('Learning Parameters > Data Features > Action Information > Partial Preconditions')
x24 = Var('Learning Parameters > Data Features > Action Information > Partial Effects')
x25 = Var('Learning Parameters > Data Features > Action Information > Cost')
x26 = Var('Learning Parameters > Data Features > State Information > Goal Access')
x27 = Var('Learning Parameters > Data Features > State Information > Init Access')
x28 = Var('Learning Parameters > Data Features > Trace > Full')
x29 = Var('Learning Parameters > Data Features > Trace > Partial')
x30 = Var('Learning Parameters > Data Features > Trace > Cost')

all_features = [x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14, x15, x16, x17, x18, x19, x20, x21, x22, x23, x24, x25, x26, x27, x28, x29, x30]


method_map = {
  'live': make_method_constraint('001001000001000000001000011100', all_features),
  'prodigy': make_method_constraint('001000000101000100001011001100', all_features),
  'observer': make_method_constraint('001001100111000000001011000010', all_features),
  'expo': make_method_constraint('001001000101000101001111001100', all_features),
  'hanna': make_method_constraint('001111000101000101001111001100', all_features),
  'arms': make_method_constraint('001001100110100101001111011010', all_features),
  'luke': make_method_constraint('001111000101000101001111001100', all_features),
  'armsj': make_method_constraint('001001100110100101001111011010', all_features),
  'hanna_luke': make_method_constraint('001111000101000101001111001100', all_features),
  'slaf': make_method_constraint('001001000100100100000000000100', all_features),
  'locm': make_method_constraint('001001100110010001001100000100', all_features),
  'opmaker2': make_method_constraint('001001100110010111101111011100', all_features),
  'locm2': make_method_constraint('001001100110010001001100000100', all_features),
  'mbp_plex': make_method_constraint('000000000000000000000000000000', all_features),
  'kira': make_method_constraint('001001000100101101001111000100', all_features),
  'aman': make_method_constraint('001001000101000101011100000100', all_features),
  'tramp': make_method_constraint('001001100110100111101111000100', all_features),
  'dup': make_method_constraint('000000000000010000001000000100', all_features),
  'nlocm': make_method_constraint('001001101110010001001100100101', all_features),
  'lop': make_method_constraint('011001100110010001001100000100', all_features),
  'stern': make_method_constraint('001000000001000000001000000100', all_features),
  'cpisa': make_method_constraint('001001100110010111101111011100', all_features),
  'louga': make_method_constraint('001001100110100101001111001010', all_features),
  'diego': make_method_constraint('001001000100100101001111011010', all_features),
  'icarus': make_method_constraint('001001000101000101001100011100', all_features),
  'fama': make_method_constraint('001001000100100101001111011010', all_features),
  'amdn': make_method_constraint('001001000100101101001100011100', all_features),
  'ccn': make_method_constraint('011000001001000000001000100000', all_features),
  'dam': make_method_constraint('001001100110100110001011011100', all_features),
  'blai': make_method_constraint('001001000100010000001000000000', all_features),
  'dup_max': make_method_constraint('000000000000010000001000000100', all_features),
  'aia': make_method_constraint('001001000101000101001111000100', all_features),
  'blai_extended': make_method_constraint('001001000100111000001000000000', all_features),
  'sam': make_method_constraint('001001000101000101001000000100', all_features),
  'rim': make_method_constraint('001001110110010111101111011100', all_features),
  'opmaker': make_method_constraint('001001100111000111101111011100', all_features),
  'olam': make_method_constraint('001001000101000101001111011100', all_features),
  'dbmps': make_method_constraint('001001110111000111101111011100', all_features),
  'SAMPlus': make_method_constraint('001111000101000101001000000100', all_features),
  'konidaris': make_method_constraint('001110001000101000001000101101', all_features),
  'andersen': make_method_constraint('001110000001001000001000101101', all_features),
  'konidaris_aaai': make_method_constraint('001000000001000000001000001100', all_features),
  'konidaris_ijcai': make_method_constraint('001110001001000000001000101101', all_features),
}


lookup_dict = gen_lookup(all_features)

custom_constraints = make_constraints('macq_constraints.txt', lookup_dict, all_features)
avoid_constraint = Or(method_map.values()).negate()

# Confirm all the methods satisfy the constraints
for m in method_map:
    assert solve((method_map[m] & custom_constraints).to_CNF()), f'Custom constraints contradict method {m}'

T = (avoid_constraint & custom_constraints).to_CNF()
sol = solve(T)
print(','.join([str(int(sol[v.name])) for v in all_features]))
