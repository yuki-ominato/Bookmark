'use client'

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Trash } from "lucide-react";
// import {LinkIcon} from "lucide-react";
// import { select } from "framer-motion/client";
// import {
//   Breadcrumb,
//   BreadcrumbEllipsis,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface Bookmark {
  id: number;
  title: string;
  url: string;
  note: string | null;
  folder_id: number | null;
}

const API_URL = "http://localhost:8000";

const BookmarkApp: React.FC = () => {
  // setBookmarkを呼び出すと、bookmarksの値が更新される
  // useStateは更新する変数と、その変数を更新する関数を返す
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newNote, setNewNote] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newfolderTitle, setNewFolderTitle] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(0);

  // フォルダ移動履歴用のスタック
  const [folderHistory, setFolderHistory] = useState<number[]>([]);
  
  // フォルダ移動
  const moveToFolder = (folderId: number) => {
    if (selectedFolderId !== null) {
      setFolderHistory((prevHistory) => [...prevHistory, selectedFolderId]);
    }
    setSelectedFolderId(folderId);
    fetchFolders(folderId);
    fetchBookmarks(folderId);
  };

    // 一つ前のフォルダに戻る
    const goBack = () => {
      if (folderHistory.length > 0) {
        const previousFolderId = folderHistory[folderHistory.length - 1];
        setFolderHistory((prevHistory) => prevHistory.slice(0, -1));
        setSelectedFolderId(previousFolderId);
        fetchFolders(previousFolderId);
        fetchBookmarks(previousFolderId);
      }
    };

  // フォルダ一覧の取得
  const fetchFolders = async (parent_id: number | null) => {
    try {
      // const url = parent_id === null
      //   ? `${API_URL}/folders`
      //   : `${API_URL}/folders?parent_id=${parent_id}`;
      const url = `${API_URL}/folders?parent_id=${parent_id}`;
      const response = await fetch(url);
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("フォルダの取得に失敗しました:", error);
    }
  };

  // 初回読み込み時にフォルダを取得
  useEffect(() => {
    fetchFolders(selectedFolderId);
  }, []);

  // フォルダの追加
  // async: 非同期関数を定義するためのキーワード
  const addFolder = async () => {
    if (newfolderTitle.trim() === "") return;
    try {
      const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: null,
          name: newfolderTitle,
          parent_id: selectedFolderId,
        }),
      });
      if (response.ok) {
        fetchFolders(selectedFolderId); // 一覧を再取得
        setNewFolderTitle("");
      }
    } catch (error) {
      console.error("フォルダの追加に失敗しました:", error);
    }
  };

  // フォルダの削除
  const removeFolder = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/folders/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchFolders(selectedFolderId); // 一覧を再取得
      }
    } catch (error) {
      console.error("フォルダの削除に失敗しました:", error);
    }
  }

  // ブックマーク一覧の取得
  const fetchBookmarks = async (folder_id: number | null) => {
    try {
      // APIからブックマークを取得
      // awaitは非同期処理が完了するまで待機するために使用
      // fetchはAPIからデータを取得するための関数
      // responseはAPIからのレスポンスを格納する変数
      // dataはレスポンスをJSON形式に変換したもの
      const url = folder_id === null
      ? `${API_URL}/bookmarks`
      : `${API_URL}/bookmarks?folder_id=${folder_id}`;
      const response = await fetch(url);
      const data = await response.json();
      setBookmarks(data);
    } catch (error) {
      console.error("ブックマークの取得に失敗しました:", error);
    }
  };

  // 初回読み込み時にブックマークを取得
  // useEffect(callback, dependencies)
  // callbackは依存配列が変更されたときに実行される関数
  // dependenciesは依存配列で、空配列の場合は初回のみ実行される
  // 今回の場合、fetchBookmarksがcallback関数
  // 依存配列は空なので、初回のみ実行される
  useEffect(() => {
    fetchBookmarks(selectedFolderId);
  }, []);

  // ブックマークの追加
  const addBookmark = async () => {
    if (newTitle.trim() === "" || newUrl.trim() === "") return;

    try {
      const response = await fetch(`${API_URL}/bookmarks`, {
        // POST:新しいデータを作成するためのHTTPメソッド
        // headers:リクエストヘッダーを指定するためのオプション
        // Content-Type:リクエストボディの形式を指定するためのヘッダー
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: null,
          title: newTitle,
          url: newUrl,
          note: newNote || null,
          folder_id: selectedFolderId
        }),
      });

      if (response.ok) {
        fetchBookmarks(selectedFolderId); // 一覧を再取得
        setNewTitle("");
        setNewUrl("");
        setNewNote("");
      }
    } catch (error) {
      console.error("ブックマークの追加に失敗しました:", error);
    }
  };

  // ブックマークの削除
  const removeBookmark = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/bookmarks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBookmarks(selectedFolderId);
      }
    } catch (error) {
      console.error("ブックマークの削除に失敗しました:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl space-y-4">
      <h1 className="text-xl font-bold text-center">Bookmark Manager</h1>
      {/* フォルダ追加フォーム */}
      <div className="flex gap-2">
        <Input
          value={newfolderTitle}
          onChange={(e) => setNewFolderTitle(e.target.value)}
          placeholder="Folder name..."
        />
        <Button onClick={addFolder}>Add Folder</Button>
      </div>
      {/* ブックマーク追加フォーム */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Bookmark title..." 
        />
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Bookmark URL..." 
        />
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Note..." 
        />
        <Button onClick={addBookmark}>Add</Button>
      </div>
      <div className="flex gap-2">
        {/* 現在フォルダ表示*/}
        {/* <Card className="flex justify-between">
          <CardContent className="flex-grow">
            <span className="block font-bold">
              {folderHistory[folderHistory.length - 1]}
            </span>
          </CardContent>
        </Card> */}
        {/* 戻るボタン */}
        <Button onClick={goBack} disabled={folderHistory.length === 0}>
          Back
        </Button>
      </div> 
      {/* フォルダ一覧 */}
      <div className="space-y-2">
        {folders.map((folder) => (
          <motion.div
            key={folder.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <Card className="p-2 flex justify-between">
              <CardContent className="flex-grow">
                {/* フォルダ選択 */}
                <span 
                  key={folder.id}
                  onClick={() => moveToFolder(folder.id)}
                  className="cursor-pointer text-blue-600 hover:underline"
                >
                  {folder.name}
                </span>
              </CardContent>

              {/* 削除ボタン */}
              <span className="flex-shrink-0 flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeFolder(folder.id)}
                >
                  <Trash className="w-5 h-5 text-red-500" />
                </Button>
              </span>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* ブックマーク一覧 */}
      <div className="space-y-2">
        {bookmarks.map((bookmark) => (
          <motion.div
            key={bookmark.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <Card className="p-2 flex justify-between">
              <CardContent className="flex-grow">
                {/* タイトル */}
                <span className="block font-bold">{bookmark.title}</span>
                {/* URL */}
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline"
                >
                  {bookmark.url}
                </a>
                {/* メモ */}
                {bookmark.note && (
                  <span className="block text-sm text-gray-500">{bookmark.note}</span>
                )}
              </CardContent>

              {/* 削除ボタン */}
              <span className="flex-shrink-0 flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeBookmark(bookmark.id)}
                >
                  <Trash className="w-5 h-5 text-red-500" />
                </Button>
              </span>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkApp;