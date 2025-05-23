from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import sqlite3

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "bookmarks.db"

# データベース接続
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# データベース初期化
def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            note TEXT,
            folder_id INTEGER NOT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE CASCADE
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Pydanticモデル
class Bookmark(BaseModel):
    id: Optional[int]
    title: str
    url: HttpUrl
    note: Optional[str] = None
    folder_id: Optional[int] = None

class Folder(BaseModel):
    id: Optional[int]
    name: str
    parent_id: Optional[int] = None

# フォルダ取得
@app.get("/folders", response_model=List[Folder])
def read_folders(parent_id: int = Query(None)):
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM folders WHERE parent_id = ?", (parent_id,))
    rows = cursor.fetchall()
    conn.close()
    return [Folder(**dict(row)) for row in rows]

# フォルダ作成
@app.post("/folders", response_model=Folder, status_code=201)
def create_folder(folder: Folder):
    conn = get_db_connection()
    cursor = conn.execute(
        "INSERT INTO folders (name, parent_id) VALUES (?, ?)",
        (folder.name, folder.parent_id)
    )
    conn.commit()
    folder_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM folders WHERE id = ?", (folder_id,)).fetchone()
    conn.close()
    return Folder(**dict(row))

# フォルダ更新
@app.put("/folders/{folder_id}", response_model=Folder)
def update_folder(folder_id: int, folder: Folder):
    conn = get_db_connection()
    cursor = conn.execute(
        "UPDATE folders SET name = ? WHERE id = ?",
        (folder.name, folder_id)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM folders WHERE id = ?", (folder_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return Folder(**dict(row))

# フォルダ削除
@app.delete("/folders/{folder_id}")
def delete_folder(folder_id: int):
    conn = get_db_connection()
    cursor = conn.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"message": "Folder deleted successfully"}

# ブックマーク一覧取得
@app.get("/bookmarks", response_model=List[Bookmark])
def read_bookmarks(folder_id: int = Query(None)):
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM bookmarks WHERE folder_id = ?", (folder_id,))
    rows = cursor.fetchall()
    conn.close()
    return [Bookmark(**dict(row)) for row in rows]

# ブックマーク作成
# app.post: HTTP POSTリクエストに対応
@app.post("/bookmarks", response_model=Bookmark, status_code=201)
def create_bookmark(bookmark: Bookmark):
    conn = get_db_connection()
    cursor = conn.execute(
        "INSERT INTO bookmarks (title, url, note, folder_id) VALUES (?, ?, ?, ?)",
        (bookmark.title, str(bookmark.url), bookmark.note, bookmark.folder_id,)
    )
    conn.commit()
    # 追加した行のIDを取得 
    bookmark_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM bookmarks WHERE id = ?", (bookmark_id,)).fetchone()
    conn.close()
    print(f"Created bookmark: {row}")  # デバッグ用ログ
    return Bookmark(**dict(row))

# ブックマーク更新
# app.put: HTTP PUTリクエストに対応
@app.put("/bookmarks/{bookmark_id}", response_model=Bookmark)
def update_bookmark(bookmark_id: int, bookmark: Bookmark):
    conn = get_db_connection()
    cursor = conn.execute(
        "UPDATE bookmarks SET title = ?, url = ?, note = ? WHERE id = ?",
        (bookmark.title, str(bookmark.url), bookmark.note, bookmark_id)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM bookmarks WHERE id = ?", (bookmark_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return Bookmark(**dict(row))

# ブックマーク削除
# app.delete: HTTP DELETEリクエストに対応
@app.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: int):
    conn = get_db_connection()
    cursor = conn.execute("DELETE FROM bookmarks WHERE id = ?", (bookmark_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted successfully"}
