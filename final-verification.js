/**
 * 最终验证脚本 - 确认任务列表修复效果
 */

console.log("=== 任务列表修复最终验证 ===");

// 测试用例：混合任务列表和普通列表
const testMarkdown = `任务清单:
- [ ] 买菜
- [x] 写代码
- [ ] 锻炼

购物清单:
- 苹果
- 香蕉
- 牛奶

工作计划:
1. 开会
2. 写报告
3. 代码review`;

console.log("输入的Markdown:");
console.log(testMarkdown);
console.log("\n" + "=".repeat(50));

// 模拟修复后的转换逻辑
function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const processedLines = [];
  let inList = false;
  let listType = "";

  for (let line of lines) {
    // 🎯 修复后的匹配逻辑
    const taskMatch = line.match(/^- \[([ x])\] (.*)$/);
    const unorderedMatch = line.match(/^- (?!\[[ x]\])(.*)$/); // 负向前瞻
    const orderedMatch = line.match(/^\d+\. (.*)$/);

    if (taskMatch) {
      if (!inList || listType !== "task-list") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        processedLines.push('<ul class="task-list">');
        listType = "task-list";
        inList = true;
      }
      const isChecked = taskMatch[1] === "x";
      const content = taskMatch[2];
      processedLines.push(
        `<li class="task-item" data-checked="${isChecked}"><input type="checkbox" ${
          isChecked ? "checked" : ""
        }>${content}</li>`
      );
    } else if (unorderedMatch) {
      if (!inList || listType !== "ul") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        processedLines.push("<ul>");
        listType = "ul";
        inList = true;
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inList || listType !== "ol") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        processedLines.push("<ol>");
        listType = "ol";
        inList = true;
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</${listType === "task-list" ? "ul" : listType}>`);
        inList = false;
        listType = "";
      }
      if (line.trim()) {
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push(`</${listType === "task-list" ? "ul" : listType}>`);
  }

  return processedLines.join("\n");
}

// 执行转换
const html = markdownToHtml(testMarkdown);
console.log("生成的HTML:");
console.log(html);
console.log("\n" + "=".repeat(50));

// 验证关键点
console.log("关键验证点:");

const checks = [
  {
    name: "任务列表格式",
    test: html.includes('class="task-list"'),
    desc: '应该包含 class="task-list"',
  },
  {
    name: "任务项格式",
    test: html.includes('class="task-item"'),
    desc: '应该包含 class="task-item"',
  },
  {
    name: "已完成任务",
    test: html.includes('data-checked="true"') && html.includes("checked"),
    desc: "已完成任务应该有正确状态",
  },
  {
    name: "待完成任务",
    test:
      html.includes('data-checked="false"') &&
      !html.includes('data-checked="false"><input type="checkbox" checked'),
    desc: "待完成任务不应该被勾选",
  },
  {
    name: "普通无序列表",
    test:
      html.includes("<ul>\n<li>苹果</li>") ||
      html.includes("<ul><li>苹果</li>"),
    desc: "普通列表应该是标准ul/li格式",
  },
  {
    name: "有序列表",
    test: html.includes("<ol>") && html.includes("<li>开会</li>"),
    desc: "有序列表应该是ol/li格式",
  },
  {
    name: "任务列表独立",
    test: !html.includes("<ul><li>[ ] 买菜</li>"),
    desc: "任务列表不应该被当作普通列表",
  },
];

checks.forEach((check, index) => {
  const status = check.test ? "✅ 通过" : "❌ 失败";
  console.log(`${index + 1}. ${check.name}: ${status}`);
  console.log(`   ${check.desc}`);
  if (!check.test) {
    console.log(`   ⚠️  需要检查这个功能`);
  }
});

console.log("\n" + "=".repeat(50));
console.log("🎯 修复总结:");
console.log("1. 使用负向前瞻正则: /^- (?!\\[[ x]\\])(.*)$/");
console.log("2. 确保任务列表格式 - [ ] 和 - [x] 不被普通列表匹配");
console.log("3. 保持列表类型独立：task-list, ul, ol");
console.log("4. 正确的HTML结构和CSS类名");

// 模拟刷新后的数据恢复
console.log("\n" + "=".repeat(50));
console.log("🔄 模拟页面刷新后的数据恢复:");

// 假设从数据库读取的markdown（简化）
const storedMarkdown = `- [ ] 买菜
- [x] 写代码
- [ ] 锻炼
- 苹果
- 香蕉`;

console.log("从数据库读取的Markdown:");
console.log(storedMarkdown);

const restoredHtml = markdownToHtml(storedMarkdown);
console.log("\n恢复后的HTML:");
console.log(restoredHtml);

const isRestoreCorrect =
  restoredHtml.includes('class="task-list"') &&
  restoredHtml.includes('data-checked="true"') &&
  restoredHtml.includes("<ul><li>苹果</li>");

console.log(`\n恢复测试: ${isRestoreCorrect ? "✅ 成功" : "❌ 失败"}`);
console.log("任务列表在刷新后应该保持正确的格式和状态！");
