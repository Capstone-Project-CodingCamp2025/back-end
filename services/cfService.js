// services/cfService.js
/**
 * userId: integer
 * allRatings: [{ user_id, place_id, rating }]
 */
function computeCF(userId, allRatings, topN = 5) {
  // kelompokkan per user
  const byUser = allRatings.reduce((acc, r) => {
    acc[r.user_id] = acc[r.user_id]||{};
    acc[r.user_id][r.place_id] = r.rating;
    return acc;
  },{});

  const target = byUser[userId] || {};
  // hitung similarity (Pearson) antara target & each other
  const sims = {};
  Object.keys(byUser).forEach(otherId => {
    if (+otherId===userId) return;
    const oRatings=byUser[otherId], common=[];
    for (let pid in target) {
      if (oRatings[pid]!=null) common.push(pid);
    }
    if (common.length<3) return; // butuh minimal 3
    // Pearson
    const avgT = common.reduce((s,p)=>s+target[p],0)/common.length;
    const avgO = common.reduce((s,p)=>s+oRatings[p],0)/common.length;
    let num=0, denT=0, denO=0;
    common.forEach(p=>{
      num  += (target[p]-avgT)*(oRatings[p]-avgO);
      denT += (target[p]-avgT)**2;
      denO += (oRatings[p]-avgO)**2;
    });
    const sim = denT && denO ? num/Math.sqrt(denT*denO) : 0;
    if (sim>0) sims[otherId]=sim;
  });

  // prediksi rating untuk item yang belum tertulis
  const scores = {};
  const weights= {};
  Object.entries(sims).forEach(([otherId, sim])=>{
    const oRatings = byUser[otherId];
    Object.entries(oRatings).forEach(([pid, r])=>{
      if (target[pid]==null) {
        scores[pid]    = (scores[pid]||0) + sim * r;
        weights[pid]   = (weights[pid]||0) + sim;
      }
    });
  });

  const preds = Object.keys(scores)
    .map(pid=>({
      place_id: +pid,
      pred: scores[pid]/(weights[pid]||1)
    }))
    .sort((a,b)=>b.pred - a.pred)
    .slice(0, topN)
    .map(o=>+o.place_id);

  return preds; // kembalikan array place_id; caller bisa ambil detail tempat
}

module.exports = { computeCF };
