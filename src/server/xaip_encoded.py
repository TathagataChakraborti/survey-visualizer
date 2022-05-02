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
    python3 xaip_encoded.py [compile|find|find-k|server]
"""

x1 = Var("Explanation > Artifact being explained > Algorithmic")
x2 = Var("Explanation > Artifact being explained > Model Reconciliation")
x3 = Var("Explanation > Artifact being explained > Inferential Reconciliation")
x4 = Var("Explanation > Artifact being explained > Plans")
x5 = Var("Explanation > Explanation Objective > Process")
x6 = Var("Explanation > Explanation Objective > Preference")
x7 = Var("Explanation > Explanation Property > Social")
x8 = Var("Explanation > Explanation Property > Contrastive")
x9 = Var("Explanation > Explanation Property > Selective")
x10 = Var("Explanation > Explanation Property > Abstraction")
x11 = Var("Explanation > Explanation Property > Addresses Vocabulary Mismatch")
x12 = Var("Explanation > Evaluation > User Study")
x13 = Var("Explanation > Problem Setting > Deterministic Dynamics")
x14 = Var("Explanation > Problem Setting > OverSubscription Setting")
x15 = Var("Explanation > Problem Setting > Temporal/Numeric")
x16 = Var("Explanation > Problem Setting > Stochastic Dynamics")
x17 = Var("Explanation > Problem Setting > Motion Planning")
x18 = Var("Explanation > Problem Setting > HTN")
x19 = Var("Explanation > Problem Setting > Qualitative Non-Determinism")
x20 = Var("Explanation > Problem Setting > Partial Observability")
x21 = Var("Explanation > Problem Setting > Reinforcement Learning")
x22 = Var("Explanation > Interpretable Behavioral Measures > Explicability")
x23 = Var("Explanation > Interpretable Behavioral Measures > Legibility")
x24 = Var("Explanation > Interpretable Behavioral Measures > Predictability")
x25 = Var("Explanation > Overview/Position Paper > Explanation")
x26 = Var("Explanation > Overview/Position Paper > Interpretable Behavioral")

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
]


bvs = [
    ("xaip1", "01000111100010000000000000"),
    ("xaip2", "01000111100110000000000000"),
    ("xaip3", "00100100110010000100000000"),
    ("xaip4", "00100100110110000100000000"),
    ("xaip5", "01100111110010000000000000"),
    ("xaip6", "01100111110110000000000000"),
    ("xaip7", "01100111110110000000000000"),
    ("xaip8", "00100100110011000000000000"),
    ("xaip9", "00100100110011000000000000"),
    ("xaip10", "00100100110111000000000000"),
    ("xaip11", "00100001100010000000000000"),
    ("xaip12", "00100001100100010000000000"),
    ("xaip13", "00100001000100010000000000"),
    ("xaip14", "01100101111100010000100000"),
    ("xaip15", "10011000001000010000100000"),
    ("xaip16", "10111000011100010000100000"),
    ("xaip17", "10110000010000010000100000"),
    ("xaip18", "10001000000010000000000000"),
    ("xaip19", "00100101000010000000000000"),
    ("xaip20", "00100001000000100000000000"),
    ("xaip21", "10010000000000010000100000"),
    ("xaip22", "00010000100010000000000000"),
    ("xaip23", "01000111100010000000000000"),
    ("xaip24", "10101001000000010000100000"),
    ("xaip25", "10101000010000010000100000"),
    ("xaip26", "00100101110000010000100000"),
    ("xaip27", "01100101101000010000100000"),
    ("xaip28", "01000101100110000000000000"),
    ("xaip29", "00100101010000010000000000"),
    ("xaip30", "00010010000100000000000000"),
    ("xaip31", "00010000000100010000100000"),
    ("xaip32", "00010000000100010000100000"),
    ("xaip33", "00010000000100010000100000"),
    ("xaip34", "00100001010000010000000000"),
    ("xaip35", "00010000010000000000000000"),
    ("xaip36", "01000000000010000000000000"),
    ("xaip37", "01000000001010000000100000"),
    ("xaip38", "00010000001000010000100000"),
    ("xaip39", "00010000000000010000000000"),
    ("xaip40", "00010000001000010000100000"),
    ("xaip41", "01000001000110001000000000"),
    ("xaip42", "10101000001000010000100000"),
    ("xaip43", "10011000001000010000100000"),
    ("xaip44", "10010000000000010000100000"),
    ("xaip45", "01000001000010000000010000"),
    ("xaip46", "01000001000010000000010000"),
    ("xaip47", "00100000000000100000000000"),
    ("xaip48", "01000001100110100000000000"),
    ("xaip49", "01000001000110000000000000"),
    ("xaip50", "00000000000000000000000010"),
    ("xaip51", "00000000000000000000000001"),
    ("xaip52", "00000000000000000000000011"),
    ("xaip53", "00000000000000000000011101"),
    ("xaip54", "00010000000000010000100000"),
    ("xaip55", "01100001010000000010000000"),
    ("xaip56", "00010000000010000000000000"),
    ("xaip57", "01000100000100000000000000"),
    ("xaip58", "00000000000000000000000001"),
    ("xaip59", "00000000000110001000001100"),
    ("xaip60", "00000000000000000000001101"),
    ("xaip61", "00000000000010000000001000"),
    ("xaip62", "00000000000000000000001100"),
    ("xaip63", "00000000000000000000000100"),
    ("xaip64", "00100000000110001000000000"),
    ("xaip65", "00000000000010000000010000"),
    ("xaip66", "00000000000000000000000010"),
    ("xaip67", "00000000000000000000000010"),
    ("xaip68", "00000000000000000000000010"),
    ("xaip69", "00000000000000000000000010"),
    ("xaip70", "00010000100100000001000000"),
    ("xaip71", "00110100010110010000000000"),
    ("xaip72", "00110000000000000000000000"),
    ("xaip73", "00010000010000000000000000"),
    ("xaip74", "01000111000000000000000000"),
    ("xaip75", "00100101100000000000000000"),
    ("xaip76", "01100111000110000000000000"),
]


method_map = {s: make_method_constraint(bv, all_features) for (s, bv) in bvs}
bv_map = {bv: s for (s, bv) in bvs}
lookup_dict = gen_lookup(all_features)
custom_constraints, preferences = make_constraints(
    "xaip_config.txt", lookup_dict, all_features
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
        save_theory(KC, "XAIP.nnf", "XAIPvars.json")

    elif sys.argv[1] == "find":
        theory, varmap = load_theory("XAIP.nnf", "XAIPvars.json")
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
