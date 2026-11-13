

// =====================================
// 1. SUPABASE CONNECTION
// =====================================

const SUPABASE_URL = "https://slexgqhusuwkhixrbcfs.supabase.co";

const SUPABASE_KEY = "sb_publishable_bMeQifM6PJUlvCLNfDhANA_v1xe7LjP";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================
// 2. HTML ELEMENTS
// =====================================

const form = document.getElementById("idea-form");
const container = document.getElementById("ideas-container");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");

let selectedCategory = "ყველა";


// =====================================
// 3. LOAD IDEAS FROM DATABASE
// =====================================

async function loadIdeas() {

    container.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "loading";
    loading.textContent = "იდეები იტვირთება...";
    container.appendChild(loading);

    const { data, error } = await db
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        container.textContent = "იდეების ჩატვირთვა ვერ მოხერხდა.";
        console.error(error);
        return;
    }

    container.replaceChildren();

    const filteredIdeas = selectedCategory === "ყველა"
        ? data
        : data.filter(idea => idea.category === selectedCategory);

    if (filteredIdeas.length === 0) {
        const empty = document.createElement("p");
        empty.className = "loading";
        empty.textContent = "ჯერ იდეები არ დამატებულა. იყავი პირველი!";
        container.appendChild(empty);
        return;
    }

    filteredIdeas.forEach(idea => {

        const card = document.createElement("article");
        card.className = "idea-card";

        const category = document.createElement("span");
        category.className = "idea-category";
        category.textContent = idea.category;

        const title = document.createElement("h3");
        title.textContent = idea.title;

        const description = document.createElement("p");
        description.className = "description";
        description.textContent = idea.description;

        const author = document.createElement("p");
        author.className = "idea-author";
        author.textContent = "ავტორი: " + idea.author;

        card.append(
            category,
            title,
            description,
            author
        );

        container.appendChild(card);

    });
}


// =====================================
// 4. ADD NEW IDEA
// =====================================

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const author = document.getElementById("author").value.trim();
    const category = document.getElementById("category").value;
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!author || !category || !title || !description) {
        message.textContent = "გთხოვ, შეავსო ყველა ველი.";
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "ქვეყნდება...";

    message.textContent = "";

    const { error } = await db
        .from("ideas")
        .insert([{
            author: author,
            category: category,
            title: title,
            description: description
        }]);

    submitBtn.disabled = false;
    submitBtn.textContent = "იდეის გამოქვეყნება";

    if (error) {
        message.textContent = "შეცდომა! იდეა ვერ გამოქვეყნდა.";
        console.error(error);
        return;
    }

    message.textContent = "იდეა წარმატებით გამოქვეყნდა! ❤️";

    form.reset();

    selectedCategory = "ყველა";

    document.querySelectorAll(".filter").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === "ყველა"
        );
    });

    await loadIdeas();

});


// =====================================
// 5. FILTER IDEAS
// =====================================

document.querySelectorAll(".filter").forEach(button => {

    button.addEventListener("click", function() {

        selectedCategory = this.dataset.category;

        document.querySelectorAll(".filter").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        loadIdeas();

    });

});


// =====================================
// 6. AUTOMATIC LIVE UPDATES
// =====================================

db.channel("ideas-live")

    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "ideas"
        },

        () => {
            loadIdeas();
        }
    )

    .subscribe();


// =====================================
// 7. INITIAL LOAD
// =====================================

loadIdeas();
