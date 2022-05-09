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
    python3 vamhri_encoded.py [compile|find|find-k|server]
"""

x1 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Robots > Visualization Robots"
)
x2 = Var("Virtual Design Element (VDE) > Virtual Entities > Robots > Simulated Robots")
x3 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Robots > Robot Digital Twins"
)
x4 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Control Objects > Panels & Buttons"
)
x5 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Control Objects > 3D Controllers"
)
x6 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Environmental > Simulated Agents"
)
x7 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Environmental > Simulated Objects"
)
x8 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Environmental > Simulated Environments"
)
x9 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Environmental > Object Digital Twins"
)
x10 = Var(
    "Virtual Design Element (VDE) > Virtual Entities > Environmental > Environment Digital Twins"
)
x11 = Var(
    "Virtual Design Element (VDE) > Virtual Alterations > Superficial > Cosmetic Alterations"
)
x12 = Var(
    "Virtual Design Element (VDE) > Virtual Alterations > Superficial > Special Effect Alterations"
)
x13 = Var(
    "Virtual Design Element (VDE) > Virtual Alterations > Morphological > Body Extensions"
)
x14 = Var(
    "Virtual Design Element (VDE) > Virtual Alterations > Morphological > Body Diminishments"
)
x15 = Var(
    "Virtual Design Element (VDE) > Virtual Alterations > Morphological > Form Transformations"
)
x16 = Var(
    "Virtual Design Element (VDE) > Robot Status Visualizations > Internal > Internal Reading"
)
x17 = Var(
    "Virtual Design Element (VDE) > Robot Status Visualizations > Internal > Internal Readiness"
)
x18 = Var(
    "Virtual Design Element (VDE) > Robot Status Visualizations > External > Robot Pose"
)
x19 = Var(
    "Virtual Design Element (VDE) > Robot Status Visualizations > External > Robot Location"
)
x20 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > External Sensor Purviews"
)
x21 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > External Sensor Numerical Readings"
)
x22 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > External Sensor Images & Videos"
)
x23 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > External Sensor 3D Data"
)
x24 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > Sensed Spatial Regions"
)
x25 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > Robot Inherent Spatial Regions"
)
x26 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Environment > User-Defined Spatial Regions"
)
x27 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Entity > Entity Labels"
)
x28 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Entity > Entity Attributes"
)
x29 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Entity > Entity Locations"
)
x30 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Entity > Entity Appearances"
)
x31 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Headings"
)
x32 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Waypoints"
)
x33 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Callouts"
)
x34 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Spatial Previews"
)
x35 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Trajectories"
)
x36 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Alteration Previews"
)
x37 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Command Options & Validity"
)
x38 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Task Status"
)
x39 = Var(
    "Virtual Design Element (VDE) > Robot Comprehension Visualizations > Task > Task Instructions"
)

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
    x31,
    x32,
    x33,
    x34,
    x35,
    x36,
    x37,
    x38,
    x39,
]


bvs = [
    ("paper_5", "001000000100000000000100000000000100000"),
    ("paper_6", "000000001000000000000000000000000000000"),
    ("paper_7", "000000100000000000001100000000010010000"),
    ("paper_8", "010000000100000000000000000000000000000"),
    ("paper_9", "000000000100000000000110000000000000000"),
    ("paper_10", "100000000100000000000010000000000010000"),
    ("paper_11", "001000001000000000000100000000000110000"),
    ("paper_12", "010000010000000000000000000000000000000"),
    ("paper_13", "000000000000000000000000000000001000000"),
    ("paper_14", "001100001100000000000110000000000000001"),
    ("paper_15", "000000001100000000100000000011000000000"),
    ("paper_16", "100100000100000101100000000000000010000"),
    ("paper_17", "000000000000000000100001000000000000001"),
    ("paper_18", "000000000000000000000000000000010010000"),
    ("paper_19", "000000000000000101000000000000111010001"),
    ("paper_20", "010000010000000000000000000000000000000"),
    ("paper_21", "010000100000000000000000000000010010000"),
    ("paper_22", "010000010000000000000000000000000000000"),
    ("paper_23", "000001000000100000000000000000000000000"),
    ("paper_24", "000000000010000000000000000000000000000"),
    ("paper_25", "000000000000000000010001000000100010000"),
    ("paper_26", "100000000000000000000100000000010111000"),
    ("paper_27", "001000000000000000000100000000000000001"),
    ("paper_28", "001100000100000001100110001010000000000"),
    ("paper_29", "000000000000000100010000000000010110000"),
    ("paper_30", "000001000000100000000000000000101000010"),
    ("paper_31", "000000000100000101100111000000000000010"),
    ("paper_32", "000000000000000001000000000000000000000"),
    ("paper_33", "100000000100000100111000000000110010001"),
    ("paper_34", "000000000000000101010111000000010110000"),
    ("paper_35", "010000010000000100111100000000110010001"),
    ("paper_36", "000000000000000000000000010010000010000"),
    ("paper_37", "100000101100000001110110000010000000000"),
    ("paper_38", "000000000000000000010001000000100010000"),
    ("paper_39", "000000000000000100100001000000000010001"),
    ("paper_40", "000000000000000000000000000010010000000"),
    ("paper_41", "000000110000000000000000000000000000000"),
    ("paper_42", "000000010000000000000000000000000000000"),
    ("paper_43", "000000100000000000000100000000000000001"),
    ("paper_44", "001010000000100000000100000000000100000"),
    ("paper_45", "000000000000000000010111000010000000000"),
    ("paper_46", "000000000000000000000101000010000000000"),
    ("paper_47", "100000100000000000010000000000000000000"),
    ("paper_48", "000100000000000000000000000000011111001"),
    ("paper_49", "000000000000000000000000000000110010110"),
    ("paper_50", "000000000000000000000100000000000000000"),
    ("paper_51", "001100001100000001000001000000000110110"),
    ("paper_52", "000000000000000000000001000000100010000"),
    ("paper_53", "000000000000000101100101001110001000000"),
    ("paper_54", "100000000000000000000000000000110110100"),
    ("paper_55", "100000000000000101000100000000000000000"),
    ("paper_56", "000000000000000000000000000010000000100"),
    ("paper_57", "000000000000000000000000000000000110000"),
    ("paper_58", "000000000000000000000000000000000010000"),
    ("paper_59", "100000001100000001000010000010000000000"),
    ("paper_60", "010000010000000000000100000000000000000"),
    ("paper_61", "000000000000000001000000000010100000000"),
    ("paper_62", "000000000000000000000000001010001000011"),
    ("paper_63", "000000001000000000000000001010000000000"),
    ("paper_64", "000100000000000000000000101010001000000"),
    ("paper_65", "000000000000000000000000000000010010001"),
    ("paper_66", "000000000100000110110001000000101010000"),
    ("paper_67", "000000000000000000000100000000000010000"),
    ("paper_68", "001010000100000000000000000000000000000"),
    ("paper_69", "000000000000000000000100000000000000000"),
    ("paper_70", "000000001000000000000100101010000000000"),
    ("paper_71", "100000000100000000000010000000000110000"),
    ("paper_72", "000000000000000000000100000000000000000"),
    ("paper_73", "001110001100000001000110000010000100100"),
    ("paper_74", "000000000000000000000111000000000000000"),
    ("paper_75", "100000000000000001001010000000000110001"),
    ("paper_76", "000100000000000000000100000000000000100"),
    ("paper_77", "001000001100000000000110000000000000000"),
    ("paper_78", "100000000000000101000010000000101000001"),
    ("paper_79", "010001010000000100000000000000000000001"),
    ("paper_80", "010000110000000000000000000000000000000"),
    ("paper_81", "010001010000000100000000000000000000000"),
    ("paper_82", "000100000000000000011000000000000000000"),
    ("paper_83", "000000000000000000000000000000100000000"),
    ("paper_84", "001100000000000001000000000000000000000"),
    ("paper_85", "100000000000000000000000000000000110000"),
    ("paper_86", "010000000000000000000000000000000010000"),
    ("paper_87", "001100000000000000000000000000000100000"),
    ("paper_88", "000000000000000001000000000010010010011"),
    ("paper_89", "001000001000000000000000000010000110000"),
    ("paper_90", "000000000000000000000000000000100000000"),
    ("paper_91", "000000000000000001000000000000000000000"),
    ("paper_92", "000000000000000000001001100111001001011"),
    ("paper_93", "000000000000000101000011100000100000000"),
    ("paper_94", "101010100000100000011000000000010110110"),
    ("paper_95", "000000000000000000000000001010001000001"),
    ("paper_96", "000100000000000000000000011110000100110"),
    ("paper_97", "000100000000000100000000000000000000000"),
    ("paper_98", "000000000000000101000000000000000000010"),
    ("paper_99", "010100000000000000000000000000011010000"),
    ("paper_100", "010000000010000110000000100000001000010"),
    ("paper_101", "000000000000001000100000000000110110010"),
    ("paper_102", "001100000000000101000000000000000100101"),
    ("paper_103", "000000000000000000010100000000000000000"),
    ("paper_104", "000000000000000000000100000000100000000"),
    ("paper_105", "001000001100000000000010000000000000000"),
    ("paper_106", "100000000000000000000000000100010010000"),
    ("paper_107", "000000000100000000000010000000000000000"),
    ("paper_108", "000010000000000000001100000000000000100"),
    ("paper_109", "010000010000000001000000000000010000001"),
    ("paper_110", "000000100100000000000000000000000000000"),
    ("paper_111", "010010010000000100000000000000000000001"),
    ("paper_112", "010000110000000000000000100000001000001"),
    ("paper_113", "010000110000000000000000000000000000001"),
    ("paper_114", "010001010000000000000000000000000000000"),
    ("paper_115", "100000000000000000001000000101010011000"),
    ("paper_116", "010001110000000000000000000000000000000"),
    ("paper_117", "010001000000000000000000000000100010000"),
    ("paper_118", "010001010000100101000011100000000000000"),
    ("paper_119", "001000000100000001000110000000000100000"),
    ("paper_120", "000100000000000000000100000000000000100"),
    ("paper_121", "010000011000000000000000000000000000000"),
    ("paper_122", "000100001000000000000000100011001000011"),
    ("paper_123", "010000000100000000000000000000000000001"),
    ("paper_124", "000000000000010000000000000000000000000"),
    ("paper_125", "000000000000000000000001001010000010010"),
    ("paper_126", "000000000000000000000100000000000000000"),
    ("paper_127", "000100000000000000000000010000000000000"),
    ("paper_128", "010000010000000100000000000010001000001"),
    ("paper_129", "000100000000000000000000000010010100010"),
    ("paper_130", "100100000000000000000000001000010110000"),
    ("paper_131", "100100000000000000000000001010010110110"),
    ("paper_132", "001000000000000100000000000000000110000"),
    ("paper_133", "011000001000000000000000000000010110001"),
    ("paper_134", "001100000000000000000000000000011110000"),
    ("paper_135", "000100000000000000000000010000000010001"),
    ("paper_136", "000001000000001000000000000000000000000"),
    ("paper_137", "000000000000000000011000000000000000000"),
    ("paper_138", "100100000000000000100000001000010110100"),
    ("paper_139", "000100000000000000000000100010010000000"),
    ("paper_140", "100000000000000001100101000000001000000"),
    ("paper_141", "000000000000000000100011000010010010010"),
    ("paper_142", "000000000000000100100000000000010000010"),
    ("paper_143", "000000000000000000000000001010001110011"),
    ("paper_144", "000000000000000000000000000000010010000"),
    ("paper_145", "000000000000000000010011000000010000000"),
    ("paper_146", "000100000000000000000000010000000000000"),
    ("paper_147", "001000000000000000000000000000110110000"),
    ("paper_148", "000000000000000000000000000000001000000"),
    ("paper_149", "101110000010000000000010000000000000000"),
    ("paper_150", "000000000010000010100000000000001000000"),
    ("paper_151", "000000000000000000010011001010000010001"),
    ("paper_152", "100000000000000000010100000000000000000"),
    ("paper_153", "000000000000100000000000000000001000011"),
    ("paper_154", "000000000000000000000000001100000000000"),
    ("paper_155", "100110001000000000000000000010001100000"),
    ("paper_156", "000100101000000000000000001000010010001"),
    ("paper_157", "001000000000000000000100000000000000000"),
    ("paper_158", "001000011000000000000000000000000000000"),
    ("paper_159", "001000000100000000010010000000000000000"),
    ("paper_160", "000000000100000100000010000000000000000"),
    ("paper_161", "100000000100000000000000000000000110000"),
    ("paper_162", "001010001100000000000010010000000010000"),
    ("paper_163", "001000001100000000000110000000000000000"),
    ("paper_164", "010001010000000100101000000000100000000"),
    ("paper_165", "001000010000000000000000000000000000000"),
    ("paper_166", "001000000000000000000000000000000000000"),
    ("paper_167", "100100000000000000000100000000000000000"),
    ("paper_168", "100000000000000000000100000000000000000"),
    ("paper_169", "000000000000000000000000000000001100001"),
    ("paper_170", "010100110000000000000000000000000100100"),
    ("paper_171", "001100000100000001000000000000000000010"),
    ("paper_172", "010001000100000001100100000000010010000"),
    ("paper_173", "000000000000000000100101000010000000000"),
    ("paper_174", "000110000000000000000100000010000000000"),
    ("paper_175", "001110001100000000000010000000000100000"),
    ("paper_176", "000000000000000000000000000000010110100"),
    ("paper_177", "100000001000000000000000010000000100000"),
    ("paper_178", "000000000000000000000000000010001000000"),
    ("paper_179", "100000000000000000000010000000000000000"),
]


method_map = {s: make_method_constraint(bv, all_features) for (s, bv) in bvs}
bv_map = {bv: s for (s, bv) in bvs}
lookup_dict = gen_lookup(all_features)
custom_constraints, preferences = make_constraints(
    "vamhri_config.txt", lookup_dict, all_features
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
        save_theory(KC, "vamhri.nnf", "vamhrivars.json")

    elif sys.argv[1] == "find":
        theory, varmap = load_theory("vamhri.nnf", "vamhrivars.json")
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
