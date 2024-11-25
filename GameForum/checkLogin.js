const checkSession=(req,res,next)=>{
    if(req.session.username){
        next()
    }else{
        res.redirect('/')
    }
}
const checkAdmin=(req,res,next)=>{
    if(req.session.username=="admin"){
        next()
    }else{
        res.redirect('/')
    }
}
module.exports= {checkSession,checkAdmin}