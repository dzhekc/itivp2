'use strict';

const {ArticleRepository} = require('../../domain/repositories/ArticleRepository');
const {Article} = require('../../domain/entities/Article');


const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class MongoArticleRepository extends ArticleRepository {
    constructor({collection}) {
        super();
        this.collection = collection;
    }

    async findAll({category, status, tag, search} = {}) {
        const filter = {};

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (tag) filter.tags = String(tag).trim().toLowerCase();
        if (search) {
            const term = String(search).trim();
            const pattern = new RegExp(escapeRegex(term), 'i');
            filter.$or = [{title: pattern}, {content: pattern}, {tags: term.toLowerCase()}];
        }

        const docs = await this.collection.find(filter).sort({createdAt: -1}).toArray();
        return docs.map(toDomain);
    }

    async findById(id) {
        if (typeof id !== 'string') return null;
        const doc = await this.collection.findOne({_id: id});
        return doc ? toDomain(doc) : null;
    }

    async create(article) {
        const doc = toPersistence(article);
        await this.collection.insertOne(doc);
        return toDomain(doc);
    }

    async update(article) {
        const {_id, createdAt, ...fields} = toPersistence(article);
        const doc = await this.collection.findOneAndUpdate(
            {_id},
            {$set: fields},
            {returnDocument: 'after'},
        );
        return doc ? toDomain(doc) : null;
    }

    async delete(id) {
        if (typeof id !== 'string') return false;
        const {deletedCount} = await this.collection.deleteOne({_id: id});
        return deletedCount > 0;
    }

    async reparentChildren(fromParentId, toParentId) {
        // Как и в Postgres-реализации, переезд в дереве не меняет updatedAt.
        await this.collection.updateMany({parentId: fromParentId}, {$set: {parentId: toParentId}});
    }

    async incrementViews(id) {
        if (typeof id !== 'string') return null;
        // $inc атомарен, параллельные просмотры не теряются.
        const doc = await this.collection.findOneAndUpdate(
            {_id: id},
            {$inc: {viewsCount: 1}},
            {returnDocument: 'after', projection: {viewsCount: 1}},
        );
        return doc ? doc.viewsCount : null;
    }
}

function toDomain(doc) {
    const {_id, createdAt, updatedAt, ...rest} = doc;
    return new Article({
        ...rest,
        id: _id,
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(updatedAt).toISOString(),
    });
}

function toPersistence(article) {
    return {
        _id: article.id,
        parentId: article.parentId ?? null,
        title: article.title,
        content: article.content,
        category: article.category,
        author: article.author,
        tags: article.tags ?? [],
        status: article.status,
        viewsCount: article.viewsCount ?? 0,
        createdAt: new Date(article.createdAt),
        updatedAt: new Date(article.updatedAt),
    };
}

module.exports = {MongoArticleRepository};
