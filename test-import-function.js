function testSystemImport() {
  // 创建测试用的导入数据
  const testData = {
    version: "1.0",
    exportTime: new Date().toISOString(),
    systemConfig: {
      siteTitle: "WeBooks测试导入",
      seoDescription: "测试系统参数导入功能",
      keywords: "测试,导入,webooks"
    },
    spaces: [
      {
        name: "导入测试空间",
        description: "用于测试导入功能的示例空间",
        iconUrl: "",
        systemCardUrl: "",
        isEncrypted: false
      }
    ],
    folders: [],
    bookmarks: []
  };
  
  console.log("测试数据已准备:", JSON.stringify(testData, null, 2));
  return testData;
}

testSystemImport();