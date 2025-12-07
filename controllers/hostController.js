const Home = require("../models/home");
const fs=require('fs');
exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    isLoggedIn: req.isLoggedIn,
    editing:false,
    user: req.session.user,
    
  });
};
exports.getEditHome = (req, res, next) => {
  const homeId=req.params.homeId;
  const editMode=req.query.editing==='true';
  Home.findById(homeId).then(home=>{
    if(!home){
      console.log("No home found for editing");
      return res.redirect("/host/host-home-list");
    }
    console.log(homeId,editMode,home);
    res.render("host/edit-home", {
    home:home,
    pageTitle: "Edit Home",
    currentPage: "host-homes",
    editing:editMode,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
  })
  
};
exports.getHostHomes = (req, res, next) => {
  Home.find().then(registeredHomes=>{
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    })
});
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating,description } = req.body;
  console.log(houseName, price, location, rating,description);
   console.log(req.file);
  if (!req.file) {
    return res.status(422).send("No image provided");
  }
  const photo = req.file.path;
  const home = new Home({houseName, price, location, rating, photo,description});
  home.save().then(()=>{
    console.log("Home Added Successfully");
  });

  res.render("host/home-added", {
    pageTitle: "Home Added Successfully",
    currentPage: "homeAdded",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};
exports.postEditHome=(req,res,next)=>{
  const {id, houseName, price, location, rating,description} = req.body;
  Home.findById(id).then(home=>{
    home.houseName=houseName;
    home.price=price;
    home.location=location;
    home.rating=rating;
    if (req.file) {
      fs.unlinkSync(home.photo); // Delete the old photo
      home.photo = req.file.path;
    }
    home.description=description;
    home.save().then(result=>{
      console.log("Home Updated Successfully",result);
    }).catch(err=>{
      console.log("Error while updating home",err);
    });
  }).catch(err=>{
    console.log("Error while finding home",err);
  });
  res.redirect("/host/host-home-list");
   
};


exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log('Came to delete ', homeId);
  Home.findByIdAndDelete(homeId).then(()=>{
    res.redirect("/host/host-home-list");
  })
  .catch(err=>{
    console.log("Error in deleting home",err);
  }
)};

  

