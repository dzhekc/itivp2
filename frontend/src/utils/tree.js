// Строит дерево страниц: раздел (category) -> корневые статьи -> дочерние статьи.
export function buildTree(articles, categories) {
  const byParent = new Map();
  for (const a of articles) {
    const key = a.parentId ?? 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(a);
  }

  const toNode = (article) => ({
    article,
    children: (byParent.get(article.id) ?? [])
      .sort((x, y) => x.title.localeCompare(y.title, 'ru'))
      .map(toNode),
  });

  const roots = byParent.get('root') ?? [];
  const allCategories = [...new Set([...categories, ...articles.map((a) => a.category)])];

  return allCategories.map((category) => ({
    category,
    nodes: roots
      .filter((a) => a.category === category)
      .sort((x, y) => x.title.localeCompare(y.title, 'ru'))
      .map(toNode),
  }));
}

// Цепочка предков от корня к статье — для хлебных крошек.
export function getAncestors(articles, article) {
  const chain = [];
  let current = article;
  const seen = new Set();
  while (current?.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    current = articles.find((a) => a.id === current.parentId);
    if (current) chain.unshift(current);
  }
  return chain;
}

// Все потомки статьи — их нельзя выбрать родителем при редактировании (иначе цикл).
export function getDescendantIds(articles, id) {
  const result = new Set();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop();
    for (const a of articles) {
      if (a.parentId === current && !result.has(a.id)) {
        result.add(a.id);
        stack.push(a.id);
      }
    }
  }
  return result;
}
