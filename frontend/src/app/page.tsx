'use client'

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Trash, LinkIcon } from "lucide-react";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  note: string | null;
}

const API_URL = "http://localhost:8000";

const BookmarkApp: React.FC = () => {
  // setBookmarkを呼び出すと、bookmarksの値が更新される
  // useStateは更新する変数と、その変数を更新する関数を返す
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newNote, setNewNote] = useState("");

  // ブックマーク一覧の取得
  const fetchBookmarks = async () => {
    try {
      // APIからブックマークを取得
      // awaitは非同期処理が完了するまで待機するために使用
      // fetchはAPIからデータを取得するための関数
      // responseはAPIからのレスポンスを格納する変数
      // dataはレスポンスをJSON形式に変換したもの
      // setBookmarksは自作関数ではなく、
      const response = await fetch(`${API_URL}/bookmarks`);
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
    fetchBookmarks();
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
        }),
      });

      if (response.ok) {
        fetchBookmarks(); // 一覧を再取得
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
        fetchBookmarks();
      }
    } catch (error) {
      console.error("ブックマークの削除に失敗しました:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl space-y-4">
      <h1 className="text-xl font-bold text-center">Bookmark Manager</h1>
      
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
