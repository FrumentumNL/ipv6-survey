exports.up = function (knex) {
    return knex.schema.createTable('survey_results', (table) => {
        table.tinyint('flags').notNullable();
        table.integer('ip4_asn').nullable();
        table.string('ip4_country', 2).nullable();
        table.integer('ip6_asn').nullable();
        table.string('ip6_country', 2).nullable();
        table.dateTime('created_at').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('survey_results');
};
