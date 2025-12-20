import os
import sys
import pathlib
import dropbox


def dropbox_connect(DROPBOX_ACCESS_TOKEN):
    """
    Return a connection to Dropbox.
    """
    try:
        dbx = dropbox.Dropbox(DROPBOX_ACCESS_TOKEN)
    except dropbox.exceptions.AuthError as e:
        print('Error connecting to Dropbox with access token: ' + str(e))
    return dbx


def dropbox_list_files(dbx, path):
    """
    Return files in a given Dropbox folder path in the Apps directory.
    """
    try:
        files = dbx.files_list_folder(path).entries
        files_list = []
        for file in files:
            if isinstance(file, dropbox.files.FileMetadata):
                files_list.append(file.path_display)

        return files_list

    except Exception as e:
        print('Error getting list of files from Dropbox: ' + str(e))


def dropbox_download_file(dbx, dropbox_file_path, local_file_path):
    """Download a file from Dropbox to the local machine."""
    try:
        with open(local_file_path, 'wb') as f:
            metadata, result = dbx.files_download(path=dropbox_file_path)
            f.write(result.content)
    except Exception as e:
        print('Error downloading file from Dropbox: ' + str(e))


def download_directory(DROPBOX_ACCESS_TOKEN, dropbox_folder_name, local_folder_name):
    """
    DROPBOX_ACCESS_TOKEN: access token generated at https://www.dropbox.com/developers/apps
    dropbox_folder_name: name of the folder inside the app folder linked to access token
    local_folder_name: local folder name. name of folder containing downloaded files
    """
    dbx = dropbox_connect(DROPBOX_ACCESS_TOKEN)
    dropbox_paths = dropbox_list_files(dbx, "/" + dropbox_folder_name)
    new_file_names = [p.split("/")[-1] for p in dropbox_paths]

    cwd = pathlib.Path.cwd()
    folder_path = os.path.join(cwd, local_folder_name)

    for dropbox_path, new_file_name in zip(dropbox_paths, new_file_names):
        file_path = os.path.join(folder_path, new_file_name)
        dropbox_download_file(dbx, dropbox_path, file_path)


if __name__ == '__main__':
    DROPBOX_ACCESS_TOKEN = sys.argv[1]
    dropbox_folder_name = sys.argv[2]
    local_folder_name = sys.argv[3]
    download_directory(DROPBOX_ACCESS_TOKEN,
                       dropbox_folder_name, local_folder_name)
