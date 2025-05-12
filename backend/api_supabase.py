from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabaseクライアントの初期化
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

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
    response = supabase.table("folders").select("*").eq("parent_id", parent_id).execute()
    return [Folder(**row) for row in response.data]

# フォルダ作成
@app.post("/folders", response_model=Folder, status_code=201)
def create_folder(folder: Folder):
    response = supabase.table("folders").insert({
        "name": folder.name,
        "parent_id": folder.parent_id
    }).execute()
    return Folder(**response.data[0])

# フォルダ更新
@app.put("/folders/{folder_id}", response_model=Folder)
def update_folder(folder_id: int, folder: Folder):
    response = supabase.table("folders").update({
        "name": folder.name
    }).eq("id", folder_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return Folder(**response.data[0])

# フォルダ削除
@app.delete("/folders/{folder_id}")
def delete_folder(folder_id: int):
    response = supabase.table("folders").delete().eq("id", folder_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"message": "Folder deleted successfully"}

# ブックマーク一覧取得
@app.get("/bookmarks", response_model=List[Bookmark])
def read_bookmarks(folder_id: int = Query(None)):
    response = supabase.table("bookmarks").select("*").eq("folder_id", folder_id).execute()
    return [Bookmark(**row) for row in response.data]

# ブックマーク作成
@app.post("/bookmarks", response_model=Bookmark, status_code=201)
def create_bookmark(bookmark: Bookmark):
    response = supabase.table("bookmarks").insert({
        "title": bookmark.title,
        "url": str(bookmark.url),
        "note": bookmark.note,
        "folder_id": bookmark.folder_id
    }).execute()
    return Bookmark(**response.data[0])

# ブックマーク更新
@app.put("/bookmarks/{bookmark_id}", response_model=Bookmark)
def update_bookmark(bookmark_id: int, bookmark: Bookmark):
    response = supabase.table("bookmarks").update({
        "title": bookmark.title,
        "url": str(bookmark.url),
        "note": bookmark.note
    }).eq("id", bookmark_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return Bookmark(**response.data[0])

# ブックマーク削除
@app.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: int):
    response = supabase.table("bookmarks").delete().eq("id", bookmark_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted successfully"}
