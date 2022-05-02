import random, sys

from nnf import Var, Or, dsharp, kissat
from difflib import get_close_matches

from encoding import (
    gen_lookup,
    make_constraints,
    make_method_constraint,
    save_theory,
    load_theory,
)

USAGE = """
    python3 macq_encoded.py [compile|find|find-k|server]
"""

x1 = Var("Learning Parameters > Agent Features > Rationality > Causally Rational")
x2 = Var("Learning Parameters > Agent Features > Rationality > Optimally Rational")
x3 = Var("Learning Parameters > Model Features > Uncertainty > Deterministic")
x4 = Var("Learning Parameters > Model Features > Uncertainty > Non-deterministic")
x5 = Var("Learning Parameters > Model Features > Uncertainty > Probabilistic")
x6 = Var("Learning Parameters > Model Features > Actions > Parameterized")
x7 = Var("Learning Parameters > Model Features > Actions > Typing")
x8 = Var("Learning Parameters > Model Features > Actions > Macros")
x9 = Var("Learning Parameters > Model Features > Actions > Cost")
x10 = Var("Learning Parameters > Model Features > Predicates > Parameterized")
x11 = Var("Learning Parameters > Model Features > Predicates > Parameters Typed")
x12 = Var(
    "Learning Parameters > Data Features > Fluent Observability > Fully Observable"
)
x13 = Var(
    "Learning Parameters > Data Features > Fluent Observability > Partially Observable"
)
x14 = Var("Learning Parameters > Data Features > Fluent Observability > Unobservable")
x15 = Var("Learning Parameters > Data Features > Fluent Observability > Noise")
x16 = Var("Learning Parameters > Data Features > Predicate Information > Parameterized")
x17 = Var("Learning Parameters > Data Features > Predicate Information > Typing")
x18 = Var("Learning Parameters > Data Features > Action Information > Parameterized")
x19 = Var("Learning Parameters > Data Features > Action Information > Typing")
x20 = Var("Learning Parameters > Data Features > Action Information > Noise")
x21 = Var(
    "Learning Parameters > Data Features > Action Information > Action Labels Known"
)
x22 = Var("Learning Parameters > Data Features > Action Information > Parameters Known")
x23 = Var(
    "Learning Parameters > Data Features > Action Information > Partial Preconditions"
)
x24 = Var("Learning Parameters > Data Features > Action Information > Partial Effects")
x25 = Var("Learning Parameters > Data Features > Action Information > Cost")
x26 = Var("Learning Parameters > Data Features > State Information > Goal Access")
x27 = Var("Learning Parameters > Data Features > State Information > Init Access")
x28 = Var("Learning Parameters > Data Features > Trace > Full")
x29 = Var("Learning Parameters > Data Features > Trace > Partial")
x30 = Var("Learning Parameters > Data Features > Trace > Cost")

all_features = [
    x1,
    x2,
    x3,
    x4,
    x5,
    x6,
    x7,
    x8,
    x9,
    x10,
    x11,
    x12,
    x13,
    x14,
    x15,
    x16,
    x17,
    x18,
    x19,
    x20,
    x21,
    x22,
    x23,
    x24,
    x25,
    x26,
    x27,
    x28,
    x29,
    x30,
]


bvs = [
    ("live", "001001000001000000001000011100"),
    ("prodigy", "001000000101000100001011001100"),
    ("observer", "001001100111000000001011000110"),
    ("expo", "001001000101000101001111001100"),
    ("hanna", "001111000101000101001111001100"),
    ("arms", "001001100111100101001111011110"),
    ("luke", "001111000101000101001111001100"),
    ("armsj", "001001100111100101001111011110"),
    ("hanna_luke", "001111000101000101001111001100"),
    ("slaf", "001001000101100100000000000100"),
    ("locm", "001001100110010001001100000100"),
    ("opmaker2", "001001100110010111101111011100"),
    ("locm2", "001001100110010001001100000100"),
    ("kira", "001001000101101101001111000100"),
    ("aman", "001001000101000101011100000100"),
    ("tramp", "001001100111100111101111000100"),
    ("dup", "001000000000010000001000000100"),
    ("nlocm", "001001101110010001001100100101"),
    ("lop", "011001100110010001001100000100"),
    ("stern", "001000000001000000001000000100"),
    ("cpisa", "001001100110010111101111011100"),
    ("louga", "001001100111100101001111001110"),
    ("diego", "001001000101100101001111011110"),
    ("icarus", "001001000101000101001100011100"),
    ("fama", "001001000101100101001111011110"),
    ("amdn", "001001000101101101001100011100"),
    ("ccn", "011000001001100000001000100111"),
    ("dam", "001001100111100110001011011100"),
    ("blai", "001001000100010000001000000100"),
    ("dup_max", "001000000000010000001000000100"),
    ("aia", "001001000101000101001111000100"),
    ("blai_extended", "001001000100011000001000000100"),
    ("sam", "001001000101000101001000000100"),
    ("rim", "001001110110010111101111011100"),
    ("opmaker", "001001100111000111101111011100"),
    ("olam", "001001000101000101001111011100"),
    ("dbmps", "001001110111000111101111011100"),
    ("SAMPlus", "001111000101000101001000000100"),
    ("konidaris", "001110001001101000001000101101"),
    ("andersen", "001110000001001000001000101101"),
    ("konidaris_aaai", "001000000001000000001000001100"),
    ("konidaris_ijcai", "001110001001000000001000101101"),
]


method_map = {s: make_method_constraint(bv, all_features) for (s, bv) in bvs}
bv_map = {bv: s for (s, bv) in bvs}
lookup_dict = gen_lookup(all_features)
custom_constraints, preferences = make_constraints(
    "macq_config.txt", lookup_dict, all_features
)
avoid_constraint = Or(method_map.values()).negate()


def compile(extra_constraints=[]):
    # Confirm all the methods satisfy the constraints
    for m in method_map:
        assert kissat.solve(
            (method_map[m] & custom_constraints).to_CNF()
        ), f"Custom constraints contradict method {m}"

    all_constraints = avoid_constraint & custom_constraints
    if extra_constraints:
        all_constraints = (
            all_constraints
            & Or(
                [
                    make_method_constraint(bv.replace(",", ""), all_features)
                    for bv in extra_constraints
                ]
            ).negate()
        )
    T = (all_constraints).to_CNF()

    # print(f"\n\n\tPapers to be written: {dsharp.compile(T, smooth=True).model_count()}\n\n")

    return dsharp.compile(T).simplify()


def find_new_paper(theory, varmap):
    sol = {}

    # Comment out if you want deterministic results
    random.shuffle(preferences)

    for feature in preferences:
        pref = "~" not in str(feature)
        var = varmap["var2label"][feature.name]
        lit = Var(var)
        if not pref:
            lit = lit.negate()
        if theory.entails(~lit):
            sol[var] = int(not pref)
            continue
        theory = theory.condition({var: pref}).simplify()
        sol[var] = int(pref)

    data = {
        "entry": ",".join(
            map(str, [sol[varmap["var2label"][x.name]] for x in all_features])
        )
    }
    print("\n\tFound Entry: " + data["entry"])

    bv = "".join(map(str, [sol[varmap["var2label"][x.name]] for x in all_features]))
    neighbours = get_close_matches(bv, bv_map.keys())

    data["neighbours"] = {bv_map[n]: {} for n in neighbours}

    print("\t Neighbours: " + ", ".join([bv_map[n] for n in neighbours]) + "\n")

    for n in neighbours:
        print(f"\n\t[{bv_map[n]}]")
        for i in range(len(bv)):
            if bv[i] != n[i]:
                data["neighbours"][bv_map[n]][all_features[i].name] = bv[i] == "1"
                print(f'\t - {all_features[i].name} made {str(bv[i] == "1")}')

    print("\n\n")

    return data


def find_k_new_papers(k, fcode):
    avoid = []
    all_papers = []
    for _ in range(k):
        KC = compile(avoid)
        save_theory(KC, f"macq-{fcode}.nnf", f"macqvars-{fcode}.json")
        theory, varmap = load_theory(f"macq-{fcode}.nnf", f"macqvars-{fcode}.json")
        data = find_new_paper(theory, varmap)
        avoid.append(data["entry"])
        all_papers.append(data)
    return all_papers


def server(port):
    from flask import Flask, jsonify, request

    app = Flask(__name__)

    @app.route("/findpapers", methods=["POST"])
    def example():
        data = request.json
        caller = str(request.remote_addr).replace(".", "_")
        return jsonify(find_k_new_papers(data["k"], caller))

    app.run(port=port)


if __name__ == "__main__":

    if sys.argv[1] == "compile":
        KC = compile()
        save_theory(KC, "macq.nnf", "macqvars.json")

    elif sys.argv[1] == "find":
        theory, varmap = load_theory("macq.nnf", "macqvars.json")
        find_new_paper(theory, varmap)

    elif sys.argv[1] == "find-k":
        k = int(sys.argv[2])
        import time

        tstart = time.time()
        find_k_new_papers(k, "")
        print(f"\n\n\tTime taken: {time.time() - tstart}\n\n")

    elif sys.argv[1] == "server":
        port = int(sys.argv[2])
        server(port)

    else:
        print(USAGE)
