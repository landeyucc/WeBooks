/**
 * 测试文件夹路径功能的脚本
 * 验证Chrome扩展现在是否能够显示完整的文件夹路径
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFolderPaths() {
  try {
    console.log('=== 测试文件夹路径功能 ===\n')

    // 获取所有用户和文件夹
    const users = await prisma.user.findMany({
      include: {
        spaces: {
          include: {
            folders: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    for (const user of users) {
      console.log(`用户: ${user.username} (${user.id})`)
      
      for (const space of user.spaces) {
        console.log(`  空间: ${space.name} (${space.id})`)
        
        if (space.folders.length === 0) {
          console.log('    (无文件夹)')
          continue
        }
        
        // 构建文件夹层级结构
        const foldersMap = new Map()
        space.folders.forEach(folder => {
          foldersMap.set(folder.id, {
            ...folder,
            children: []
          })
        })
        
        // 建立父子关系
        const rootFolders = []
        for (const [id, folder] of foldersMap.entries()) {
          if (folder.parentFolderId) {
            const parent = foldersMap.get(folder.parentFolderId)
            if (parent) {
              parent.children.push(folder)
            } else {
              rootFolders.push(folder)
            }
          } else {
            rootFolders.push(folder)
          }
        }
        
        // 递归显示文件夹结构
        const displayFolder = (folder, indent = '') => {
          console.log(`${indent}📁 ${folder.name} (${folder.id})`)
          folder.children.forEach(child => displayFolder(child, indent + '  '))
        }
        
        rootFolders.forEach(folder => displayFolder(folder, '    '))
        console.log()
      }
    }

    // 模拟API调用测试
    console.log('\n=== 模拟Chrome扩展获取文件夹API响应 ===')
    const testSpace = users[0]?.spaces[0]
    if (testSpace && testSpace.folders.length > 0) {
      // 模拟后端API的路径构建逻辑
      const folders = testSpace.folders
      
      // 构建文件夹路径映射
      const foldersMap = new Map()
      folders.forEach(folder => {
        foldersMap.set(folder.id, {
          id: folder.id,
          name: folder.name,
          parentFolderId: folder.parentFolderId,
          path: []
        })
      })

      // 递归构建路径
      const buildPath = (folderId) => {
        const folder = foldersMap.get(folderId)
        if (!folder || folder.path.length > 0) {
          return folder ? folder.path : []
        }
        
        if (!folder.parentFolderId) {
          folder.path = [folder.name]
          return folder.path
        }
        
        const parentPath = buildPath(folder.parentFolderId)
        folder.path = [...parentPath, folder.name]
        return folder.path
      }

      // 为所有文件夹构建路径
      folders.forEach(folder => {
        if (!foldersMap.get(folder.id).path.length) {
          buildPath(folder.id)
        }
      })

      // 模拟API响应格式
      const formattedFolders = folders.map(folder => ({
        ...folder,
        path: foldersMap.get(folder.id).path,
        pathString: foldersMap.get(folder.id).path.join('/'),
        bookmarkCount: 0
      }))

      console.log('API响应示例:')
      console.log(JSON.stringify({ folders: formattedFolders }, null, 2))
      
      console.log('\nChrome扩展中文件夹显示效果:')
      formattedFolders.forEach(folder => {
        console.log(`  ${folder.pathString} (${folder.id})`)
      })
    }

  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testFolderPaths()