const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    select: { id: true, username: true }
  })
  console.log(`用户ID: ${user?.id}`)
  console.log(`用户名: ${user?.username}`)
  await prisma.$disconnect()
}

main()
