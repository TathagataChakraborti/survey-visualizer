import os
import sys
import dropbox
import pathlib
import pandas as pd
from dropbox.exceptions import AuthError


def dropbox_connect(DROPBOX_ACCESS_TOKEN):
    """Create a connection to Dropbox."""

    try:
        dbx = dropbox.Dropbox(DROPBOX_ACCESS_TOKEN)
    except AuthError as e:
        print('Error connecting to Dropbox with access token: ' + str(e))
    return dbx


def dropbox_list_files(dbx, path):
    """Return a Pandas dataframe of files in a given Dropbox folder path in the Apps directory.
    """
    try:
        files = dbx.files_list_folder(path).entries
        files_list = []
        for file in files:
            if isinstance(file, dropbox.files.FileMetadata):
                metadata = {
                    'name': file.name,
                    'path_display': file.path_display,
                    'client_modified': file.client_modified,
                    'server_modified': file.server_modified
                }
                files_list.append(metadata)

        df = pd.DataFrame.from_records(files_list)
        return df.sort_values(by='server_modified', ascending=False)

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


def dropbox_upload_file(dbx, local_path, local_file, dropbox_file_path):
    """Upload a file from the local machine to a path in the Dropbox app directory.

    Args:
        local_path (str): The path to the local file.
        local_file (str): The name of the local file.
        dropbox_file_path (str): The path to the file in the Dropbox app directory.

    Example:
        dropbox_upload_file('.', 'test.csv', '/stuff/test.csv')

    Returns:
        meta: The Dropbox file metadata.
    """

    try:
        local_file_path = pathlib.Path(local_path) / local_file

        with local_file_path.open("rb") as f:
            meta = dbx.files_upload(
                f.read(), dropbox_file_path, mode=dropbox.files.WriteMode("overwrite"))

            return meta
    except Exception as e:
        print('Error uploading file to Dropbox: ' + str(e))


def dropbox_get_link(dbx, dropbox_file_path):
    """Get a shared link for a Dropbox file path.

    Args:
        dropbox_file_path (str): The path to the file in the Dropbox app directory.

    Returns:
        link: The shared link.
    """

    try:
        shared_link_metadata = dbx.sharing_create_shared_link_with_settings(
            dropbox_file_path)
        shared_link = shared_link_metadata.url
        return shared_link.replace('?dl=0', '?dl=1')
    except dropbox.exceptions.ApiError as exception:
        if exception.error.is_shared_link_already_exists():
            shared_link_metadata = dbx.sharing_get_shared_links(
                dropbox_file_path)
            shared_link = shared_link_metadata.links[0].url
            return shared_link.replace('?dl=0', '?dl=1')


def download_directory(DROPBOX_ACCESS_TOKEN, dropbox_folder_name, local_folder_name):
    """
    DROPBOX_ACCESS_TOKEN: access token generated at https://www.dropbox.com/developers/apps
    dropbox_folder_name: name of the folder inside the app folder linked to access token
    local_folder_name: local folder name. name of folder containing downloaded files
    """
    dbx = dropbox_connect(DROPBOX_ACCESS_TOKEN)
    file_info_df = dropbox_list_files(dbx, "/" + dropbox_folder_name)

    dropbox_paths = file_info_df["path_display"].to_list()
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
