from fastapi import FastAPI, HTTPException
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
            note TEXT
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

# ブックマーク一覧取得
@app.get("/bookmarks", response_model=List[Bookmark])
def read_bookmarks():
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM bookmarks")
    rows = cursor.fetchall()
    conn.close()
    return [Bookmark(**dict(row)) for row in rows]

# 単一ブックマーク取得
@app.get("/bookmarks/{bookmark_id}", response_model=Bookmark)
def read_bookmark(bookmark_id: int):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM bookmarks WHERE id = ?", (bookmark_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return Bookmark(**dict(row))

# ブックマーク作成
@app.post("/bookmarks", response_model=Bookmark, status_code=201)
def create_bookmark(bookmark: Bookmark):
    conn = get_db_connection()
    cursor = conn.execute(
        "INSERT INTO bookmarks (title, url, note) VALUES (?, ?, ?)",
        (bookmark.title, str(bookmark.url), bookmark.note)
    )
    conn.commit()
    bookmark_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM bookmarks WHERE id = ?", (bookmark_id,)).fetchone()
    conn.close()
    return Bookmark(**dict(row))

# ブックマーク更新
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
@app.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: int):
    conn = get_db_connection()
    cursor = conn.execute("DELETE FROM bookmarks WHERE id = ?", (bookmark_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted successfully"}
