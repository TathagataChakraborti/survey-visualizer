import json
import sys


def read_json(file_path):
    f = open(file_path)
    data = json.load(f)
    f.close()

    return data


if __name__ == '__main__':
    file_path = sys.argv[1]
    res = read_json(file_path)
    print(res["access_token"])
