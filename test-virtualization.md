# 虚拟化渲染测试文档

这是一个用于测试便签虚拟化渲染功能的长文档。

## 第一部分：基础 Markdown 语法

### 文本格式

**粗体文本** 和 _斜体文本_ 以及 ~~删除线文本~~

### 列表

- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项 1
  - 嵌套列表项 2
- 无序列表项 3

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

### 代码块

```javascript
function testVirtualization() {
  console.log("测试虚拟化渲染功能");
  return "只渲染可视区域的内容";
}
```

## 第二部分：更多内容

这里是更多的测试内容，用于触发虚拟化渲染。当内容超过 1000 个字符时，应该启用虚拟化功能。

### 表格

| 列 1   | 列 2   | 列 3   |
| ------ | ------ | ------ |
| 数据 1 | 数据 2 | 数据 3 |
| 数据 4 | 数据 5 | 数据 6 |

### 引用

> 这是一个引用块
> 包含多行内容
> 用于测试虚拟化渲染

## 第三部分：长文本内容

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### 重复内容块 1

这是第一个重复的内容块，用于增加文档长度以测试虚拟化渲染功能。当内容足够长时，只有可视区域的内容会被渲染到 DOM 中，这可以显著提升性能。

### 重复内容块 2

这是第二个重复的内容块，继续增加文档长度。虚拟化渲染会将内容分割成多个块，并根据滚动位置决定渲染哪些块。

### 重复内容块 3

这是第三个重复的内容块。当用户滚动时，会动态地加载和卸载内容块，保持 DOM 的轻量级。

### 重复内容块 4

这是第四个重复的内容块。占位符元素会保持正确的滚动条高度，确保滚动体验的一致性。

### 重复内容块 5

这是第五个重复的内容块。虚拟化渲染特别适合长文档和大量数据的展示场景。

## 第四部分：技术特性

### 虚拟化的优势

1. **性能优化**：只渲染可视区域的内容
2. **内存节省**：减少 DOM 元素数量
3. **流畅滚动**：保持滚动体验的平滑性
4. **动态加载**：根据需要加载内容

### 实现细节

- 内容分块：将长文本分割成多个块
- 可视区域计算：根据滚动位置计算需要渲染的块
- 占位符：使用占位符保持正确的滚动条高度
- 缓冲区：提前渲染一些额外的块以提升体验

## 第五部分：更多测试内容

### 数学公式示例

虽然这里不支持 LaTeX，但我们可以用文本表示：

E = mc²

### 任务列表

- [x] 完成虚拟化组件开发
- [x] 集成到便签系统
- [ ] 性能测试
- [ ] 用户体验优化

### 链接和图片

[测试链接](https://example.com)

### 分隔线

---

### 最后一部分

这是文档的最后一部分。如果虚拟化工作正常，当您滚动到这里时，前面的某些内容块应该已经从 DOM 中卸载，而这部分内容是新加载的。

在浏览器的开发者工具中，您应该能看到控制台输出关于虚拟化渲染的日志信息，显示当前渲染的块数和渲染比例。

---

**测试完成**

总字符数：约 2500 字符，应该足以触发虚拟化渲染功能。
