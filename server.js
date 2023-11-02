import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/listDB");

const itemsSchema = new mongoose.Schema({
  item : String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    item : "Welcome to your todolist!"
});

const item2 = new Item({
  item : "Hit the + button to add a new item."
});

const item3 = new Item({
  item : "<-- Hit this to delete an item."
});

const date = new Date();
const options = {
  weekday : "long",
  day : "numeric",
  month : "long"
};
const day = date.toLocaleDateString("en-US",options);

const objects = [item1,item2,item3];

app.get("/", async (req, res)=>{
  var items = await Item.find();
  if(items.length == 0){
    await Item.insertMany(objects);
    items = await Item.find();
  }
  res.render("list.ejs", {listTitle: "Today", newListItems: items});
});

const listsSchema = new mongoose.Schema({
    name : String,
    items : [itemsSchema]
});

const List = mongoose.model("List",listsSchema);

app.get("/:customListName", async(req,res)=>{
  const customName = req.params.customListName;
  if(customName != "favicon.ico"){
    const f = await List.findOne({name : customName});
    if(f == null) {
      const list = new List({
        name : customName,
        items : objects
      });
      list.save();
    }
    const oitems = await List.findOne({name : customName});
    if(oitems == null) res.redirect("/" + customName);
    else res.render("list.ejs", {listTitle: oitems.name, newListItems: oitems.items});
  }
});

app.post("/", async (req, res)=>{
  const item = req.body.newItem;
  const route = req.body.list;
  const newItem = new Item({
    item : item
  });
  if (req.body.list != "Today") {
    const oitem = await List.findOne({name : route});
    oitem.items.push(newItem);
    oitem.save();
    res.redirect("/" + route);
  } else {
    newItem.save();
    res.redirect("/");
  }
});

app.post("/delete",async (req,res)=>{
  var listname = req.body.list;
    var id = req.body.checkbox;
    if(listname == "Today"){
      await Item.deleteOne({_id : id});
      res.redirect("/");
    }
    else{
      const oitem = await List.findOneAndUpdate({name : listname},{$pull: {items : {_id : id}}});
      res.redirect("/" + listname);
    }
});

app.listen(3000,()=>{
  console.log("Server has started");
});
