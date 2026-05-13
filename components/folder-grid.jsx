"use client"
import { useRouter } from 'next/navigation'
import FolderCard from './folder-card'

export default function FolderGrid({ folders }) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {folders.map((folder) => (
        <FolderCard
          key={folder._id}
          folder={folder}
          onOpen={(folderId) => router.push(`/dashboard/folder/${folderId}`)}
        />
      ))}
    </div>
  )
}