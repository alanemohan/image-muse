def commit_callback(commit):
    if commit.author_name == b"gpt-engineer-app[bot]":
        commit.author_name = b"Alane Mohan"
        commit.author_email = b"alanemohan@gmail.com"

    if commit.committer_name == b"gpt-engineer-app[bot]":
        commit.committer_name = b"Alane Mohan"
        commit.committer_email = b"alanemohan@gmail.com"

    if commit.author_email == b"114716159+alanemohan@users.noreply.github.com":
        commit.author_email = b"alanemohan@gmail.com"

    if commit.committer_email == b"114716159+alanemohan@users.noreply.github.com":
        commit.committer_email = b"alanemohan@gmail.com"