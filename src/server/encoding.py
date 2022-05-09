import argparse, csv, os, json

from nnf import And, Or, dimacs

USAGE = """\n\n\tUsage: ./encoding.py [--seed <csv file>]\n"""


CUSTOM_PYTHON = """
method_map = {s: make_method_constraint(bv, all_features) for (s,bv) in bvs}
bv_map = {bv: s for (s,bv) in bvs}
lookup_dict = gen_lookup(all_features)
custom_constraints, preferences = make_constraints('SLUG_config.txt', lookup_dict, all_features)
avoid_constraint = Or(method_map.values()).negate()

def compile(extra_constraints=[]):
    # Confirm all the methods satisfy the constraints
    for m in method_map:
        assert kissat.solve((method_map[m] & custom_constraints).to_CNF()), f'Custom constraints contradict method {m}'

    all_constraints = avoid_constraint & custom_constraints
    if extra_constraints:
        all_constraints = all_constraints & Or([make_method_constraint(bv.replace(',',''), all_features) for bv in extra_constraints]).negate()
    T = (all_constraints).to_CNF()

    return dsharp.compile(T).simplify()


def find_new_paper(theory, varmap):
    sol = {}

    # Comment out if you want deterministic results
    random.shuffle(preferences)

    for feature in preferences:
        pref = '~' not in str(feature)
        var = varmap['var2label'][feature.name]
        lit = Var(var)
        if not pref:
            lit = lit.negate()
        if theory.entails(~lit):
            sol[var] = int(not pref)
            continue
        theory = theory.condition({var: pref}).simplify()
        sol[var] = int(pref)

    data = {'entry': ','.join(map(str, [sol[varmap['var2label'][x.name]] for x in all_features]))}
    print("\\n\\tFound Entry: " + data['entry'])

    bv = ''.join(map(str, [sol[varmap['var2label'][x.name]] for x in all_features]))
    neighbours = get_close_matches(bv, bv_map.keys())

    data['neighbours'] = {bv_map[n]: {} for n in neighbours}

    print('\\t Neighbours: ' + ', '.join([bv_map[n] for n in neighbours]) + '\\n')

    for n in neighbours:
        print(f'\\n\\t[{bv_map[n]}]')
        for i in range(len(bv)):
            if bv[i] != n[i]:
                data['neighbours'][bv_map[n]][all_features[i].name] = (bv[i] == "1")
                print(f'\\t - {all_features[i].name} made {str(bv[i] == "1")}')

    print('\\n\\n')

    return data

def find_k_new_papers(k, fcode):
    avoid = []
    all_papers = []
    for _ in range(k):
        KC = compile(avoid)
        save_theory(KC, f'macq-{fcode}.nnf', f'macqvars-{fcode}.json')
        theory, varmap = load_theory(f'macq-{fcode}.nnf', f'macqvars-{fcode}.json')
        data = find_new_paper(theory, varmap)
        avoid.append(data['entry'])
        all_papers.append(data)
    return all_papers

def server(port):
    from flask import Flask, jsonify, request
    app = Flask(__name__)

    @app.route('/findpapers', methods=['POST'])
    def example():
        data = request.json
        caller = str(request.remote_addr).replace('.', '_')
        return jsonify(find_k_new_papers(data['k'], caller))

    app.run(port=port)


if __name__ == '__main__':

    if sys.argv[1] == 'compile':
        KC = compile()
        save_theory(KC, 'SLUG.nnf', 'SLUGvars.json')

    elif sys.argv[1] == 'find':
        theory, varmap = load_theory('SLUG.nnf', 'SLUGvars.json')
        find_new_paper(theory, varmap)

    elif sys.argv[1] == 'find-k':
        k = int(sys.argv[2])
        find_k_new_papers(k, '')

    elif sys.argv[1] == 'server':
        port = int(sys.argv[2])
        server(port)

    else:
        print(USAGE)

"""


def seed(fn):

    # load the csv file
    with open(fn, "r") as f:
        reader = csv.reader(f)
        lines = list(reader)

    # To be robust to various data formats, we detect the start of data and features
    assert lines[1][0] == "", "Second row should be empty for nested features."
    data_start = 1
    while lines[data_start][0] == "":
        data_start += 1

    feature_start = 1
    while lines[1][feature_start] == "":
        feature_start += 1

    SLUG = os.path.basename(fn).split(".")[0]
    encfile = SLUG + "_encoded.py"
    conffile = SLUG + "_config.txt"

    # Populate all of the empty cells with the previous value
    for row in range(data_start):
        for col in range(feature_start, len(lines[row])):
            if lines[row][col] == "":
                lines[row][col] = lines[row][col - 1]

    seed = "\nimport random, sys\n\nfrom nnf import Var, Or, dsharp, kissat\n"
    seed += "from difflib import get_close_matches\n"
    seed += "\nfrom encoding import gen_lookup, make_constraints, make_method_constraint, save_theory, load_theory\n\n"
    seed += f'USAGE = """\n    python3 {SLUG}_encoded.py [compile|find|find-k|server]\n"""\n\n'

    for i in range(feature_start, len(lines[0])):
        feature_string = " > ".join([lines[j][i].strip() for j in range(data_start)])
        seed += f"x{i-feature_start+1} = Var('{feature_string}')\n"

    seed += (
        "\nall_features = ["
        + ", ".join([f"x{i}" for i in range(1, len(lines[0]) - feature_start + 1)])
        + "]\n\n"
    )

    all_methods = []
    seed += "\nbvs = [\n"
    for i in range(data_start, len(lines)):
        slug = lines[i][0].replace("-", "_").replace("+", "Plus")
        symbol = {"": "0", "0": "0", "x": "1", "1": "1"}
        bv = "".join([symbol[lines[i][j]] for j in range(feature_start, len(lines[i]))])
        if bv == "":
            print(f"WARNING: Empty line in {fn} at line {i+1} for slug [{slug}].")
            continue
        all_methods.append(slug)
        seed += f"    ('{slug}', '{bv}'),\n"
    seed += "]\n\n"

    assert len(all_methods) == len(
        set(all_methods)
    ), f"Duplicate slug names detected in {fn}."

    seed += CUSTOM_PYTHON.replace("SLUG", SLUG)

    # Write the seed file if it doesn't exist
    towrite = True
    if os.path.exists(encfile):
        # Query user
        print(f"{encfile} already exists. Overwrite? (y/n)")
        answer = input()
        if answer != "y":
            towrite = False
    if towrite:
        with open(encfile, "w") as f:
            f.write(seed)

    # Write the constraints file if it doesn't exist
    towrite = True
    if os.path.exists(conffile):
        # Query user
        print(f"{conffile} already exists. Overwrite? (y/n)")
        answer = input()
        if answer != "y":
            towrite = False
    if towrite:
        with open(conffile, "w") as f:
            f.write(";\n")
            f.write('; Preferences on the default "simple" setting\n')
            f.write(";\n")
            for i in range(feature_start, len(lines[0])):
                feature_string = " > ".join(
                    [lines[j][i].strip() for j in range(data_start)]
                )
                f.write(f"-({feature_string})\n")
            f.write("\n\n; Custom constraints\n\n")
            f.write("; Use the <type>:<description> pattern for custom constraints\n")
            f.write(
                "; <description> should be a comma-separated list of feature names\n"
            )
            f.write("; <type> can be one of:\n")
            f.write(";   - atmostone\n")
            f.write(";   - atleastone\n")
            f.write(";   - oneof\n")
            f.write(";   - implies\n\n")


def gen_lookup(vars):
    lookup = {}
    for v in vars:
        for f in v.name.split(" > "):
            if f not in lookup:
                lookup[f] = set()
            lookup[f].add(v)
    return lookup


def lookup(name, lookup_dict, vars):
    toret = None
    tonegate = False
    if name[0] == "~":
        tonegate = True
        name = name[1:]
    if name in lookup_dict:
        toret = lookup_dict[name]
    else:
        toret = {v for v in vars if name in v.name}
    assert toret, f"Could not find feature {name} in the lookup dictionary."
    if tonegate:
        toret = {v.negate() for v in toret}
    return toret


def make_method_constraint(bv, vars):
    lits = []
    for b, v in zip(bv, vars):
        if b == "1":
            lits.append(v)
        elif b == "0":
            lits.append(~v)
        else:
            assert False, f"Unknown literal: {b}"
    return And(lits)


def make_constraints(consfile, lookup_dict, all_vars):
    print("\nGenerating custom constraints...")
    with open(consfile, "r") as f:
        lines = [l.strip() for l in f.readlines()]
    constraints = []
    preferences = []
    for line in lines:
        if line == "" or line[0] == ";":
            continue

        if line[0] in ["-", "+"]:
            assert "(" == line[1] and ")" == line[-1], f"Invalid preference: {line}"
            desc = line[2:-1]
            var = lookup(desc, lookup_dict, all_vars)
            assert len(var) == 1, f"Multiple features found for {desc}"
            var = list(var)[0]
            if line[0] == "-":
                preferences.append(~var)
            else:
                preferences.append(var)
            continue

        typ, desc = line.split(":")

        descs = [d.strip() for d in desc.split(",")]

        if typ == "implies":
            for i in range(len(descs) - 1):
                lhs = lookup(descs[i], lookup_dict, all_vars)
                rhs = lookup(descs[i + 1], lookup_dict, all_vars)
                assert len(lhs) == 1 and len(rhs) == 1, f"Invalid constraint: {line}"
                constraints.append(~list(lhs)[0] | list(rhs)[0])

        vars = set()

        for d in descs:
            vars.update(lookup(d, lookup_dict, all_vars))

        print(f"  adding {typ} constraint with {len(vars)} vars")

        assert typ in [
            "atmostone",
            "atleastone",
            "oneof",
            "implies",
        ], f"Unknown constraint type: {typ}"

        if typ in ["atleastone", "oneof"]:
            constraints.append(Or(vars))

        if typ in ["atmostone", "oneof"]:
            for v1 in vars:
                for v2 in vars:
                    if v1 != v2:
                        constraints.append(~v1 | ~v2)

    print("...done.\n")
    return (And(constraints), preferences)


def generate_varmap(KC):
    var_labels = {v: i + 1 for i, v in enumerate(KC.vars())}
    reversed_var_labels = {i: v for v, i in var_labels.items()}
    return {"var2label": var_labels, "label2var": reversed_var_labels}


def save_theory(KC, thfile, varfile):
    print("Saving theory...")
    varmap = generate_varmap(KC)
    with open(thfile, "w") as f:
        dimacs.dump(KC, f, var_labels=varmap["var2label"])
    with open(varfile, "w") as f:
        json.dump(varmap, f, indent=2)
    print("...done.\n")


def load_theory(thfile, varfile):
    print("Loading theory...")
    with open(thfile, "r") as f:
        th = dimacs.load(f)
    with open(varfile, "r") as f:
        var_labels = json.load(f)
    print("...done.\n")
    return (th, var_labels)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=USAGE)
    parser.add_argument(
        "--seed", help="Seed a constraint file for a new visualization."
    )
    args = parser.parse_args()

    if args.seed:
        seed(args.seed)
