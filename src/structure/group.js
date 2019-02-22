const APIObject = require("./apiobject");
const Util = require("../util");
const User = require("./user");

/**
 * Represents a MangaDex translation group
 */
class Group extends APIObject {
    parse(data) {
        /**
         * MangaDex Group ID
         * @type {Number}
         */
        this.id = data.id;

        /**
         * Viewcount (Web Parsing)
         * @type {String}
         */
        this.views = data.views ? parseInt(data.views.replace(/\D/g, "")) : undefined;

        /**
         * Group language code (Web Parsing)
         * @type {String}
         */
        this.language = data.language ? data.language.toUpperCase(): undefined;

        /**
         * Group description (Web Parsing)
         * @type {String}
         */
        this.description = data.description ? data.description.replace(/<\s*br\s*\/>/gmi, ""): undefined; // Removes <br />

        /**
         * Followers (Web Parsing)
         * @type {String}
         */
        this.followers = data.followers ? parseInt(data.followers.replace(/\D/g, "")) : undefined;

        /**
         * Number of chapters uploaded (Web Parsing)
         * @type {String}
         */
        this.uploads = data.uploads ? parseInt(data.uploads.replace(/\D/g, "")) : undefined;

        /**
         * Official Group Name (Web Parsing)
         * @type {String}
         */
        this.title = data.title;

        /**
         * Official Group Links (Web Parsing)
         * Website, Discord, IRC, and Email
         * @type {Object}
         */
        this.links = {};
        if (data.website) this.links.website = data.website;
        if (data.discord) this.links.discord = data.discord;
        if (data.irc) this.links.irc = data.irc;
        if(data.email) this.links.email = data.email;

        /**
         * Leader User Object (Web Parsing)
         * Contains ID only, use fill() for full data.
         * @type {User}
         */
        this.leader = data.leader ? new User(parseInt(data.leader), true) : undefined;

        /**
         * Array of members (Web Parsing)
         * @type {Array<User>}
         */
        this.members = []
        if (data.members) for (let i of data.members) this.members.push(new User(i, true));
    }

    fill(id) {
        const web = "https://mangadex.org/group/"; 
        if (!id) id = this.id;

        return new Promise((resolve, reject) => {
            Util.getMatches(web + id.toString(), {
                "title": /class=["']card-header["'][\D\n]+<\/span> (.+) <img/gmi,
                "language": /class=["']card-header["'][\D\n]+<\/span> .+ <img [^<>]+ src=["']https:[\w/:.]+(\w{2}).png/gmi,
                "views": /Stats:[\D\n]+([\d,]+)<\/li>[\D\n]+[\d,]+<\/li>[\D\n]+[\d,]+<\/li>/gmi,
                "followers": /Stats:[\D\n]+[\d,]+<\/li>[\D\n]+([\d,]+)<\/li>[\D\n]+[\d,]+<\/li>/gmi,
                "uploads": /Stats:[\D\n]+[\d,]+<\/li>[\D\n]+[\d,]+<\/li>[\D\n]+([\d,]+)<\/li>/gmi,
                "website": /Links:[\d\D\n]+<a target=["']_blank["'] href=["']([^<>\s]+)["']><span[^<>]+title=["']Website["']/gmi,
                "discord": /Links:[\d\D\n]+<a target=["']_blank["'] href=["']([^<>\s]+)["']><span[^<>]+title=["']Discord["']/gmi,
                "irc": /Links:[\d\D\n]+<a target=["']_blank["'] href=["']([^<>\s]+)["']><span[^<>]+title=["']IRC["']/gmi,
                "email": /Links:[\d\D\n]+<a target=["']_blank["'] href=["']([^<>\s]+)["']><span[^<>]+title=["']Email["']/gmi,
                "description": /Description[\w\W\n]+<div class=["']card-body["']>([\w\W\n]+)<\/div>\s<\/div>\s{1,2}<ul/gmi,
                "leader": /Leader:.+\s{1,2}.+href=["']\/user\/(\d+)\/.+["']>/gmi,
                "members": /<li [^>]+><span [^>]+><\/span> <a [^\/]+\/user\/(\d+)\/[^"']+["']>[^>]+><\/li>/gmi
            }, (matches) => {
                this.parse({...matches, id: id});
                resolve(this);
            }).on('error', reject);;
        });
    }

    /**
     * Executes Group.search() then executes fill() with the most relevent user.
     * @param {String} query Quicksearch query like a name or description
     */
    fillByQuery(query) {
        return new Promise((resolve, reject) => {
            Group.search(query).then((res)=>{
                if (res.length == 0) reject("No Group Found"); 
                else this.fill(parseInt(res[0])).then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Gets full MangaDex HTTPS link. 
     * @param {"id"} property A property in this object
     * Unknown properties defaults to MangaDex's homepage
     * @returns {String} String with link
     */
    getFullURL(property) {
        const homepage = "https://mangadex.org"
        switch(property) {
            default:
                return homepage;
            case "id":
                return homepage + "/group/" + this.id.toString();
        }
    }

    /**
     * MangaDex group quicksearch
     * @param {String} query Quicksearch query like a name or description
     */
    static search(query) {
        const regex = /<td><a href=["']\/group\/(\d+)\/[^"'\/<>]+["']>/gmi;
        return new Promise((resolve, reject) => {
            Util.quickSearch(query, regex, resolve).on('error', reject);
        });
    }
}

module.exports = Group;