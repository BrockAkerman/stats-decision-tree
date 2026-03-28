import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE DECISION TREE  —  v3 (+ A/B, Evaluation, Interpretability)
// ─────────────────────────────────────────────────────────────────────────────

const TREE = {

  // ═══════════════════════════════════════════════════════
  // ROOT
  // ═══════════════════════════════════════════════════════
  root: {
    question: "What is your primary machine learning task?",
    subtitle: "Select the category that best describes what you're trying to accomplish.",
    options: [
      { label: "Classify data into categories", icon: "⬡", tag: "SUPERVISED", next: "clf_target_type" },
      { label: "Predict a numeric value", icon: "∿", tag: "SUPERVISED", next: "reg_target_count" },
      { label: "Find hidden groups or structure", icon: "◎", tag: "UNSUPERVISED", next: "clu_know_k" },
      { label: "Detect anomalies or outliers", icon: "⚠", tag: "UNSUPERVISED", next: "ano_labels" },
      { label: "Reduce dimensions or extract features", icon: "⇲", tag: "UNSUPERVISED", next: "dim_goal" },
      { label: "Find patterns / association rules in transactions", icon: "⇄", tag: "UNSUPERVISED", next: "arm_datatype" },
      { label: "Deep learning — images, text, or sequences", icon: "◈", tag: "DEEP LEARNING", next: "dl_modality" },
      { label: "Learn by trial and reward (agent)", icon: "⟳", tag: "REINFORCEMENT", next: "rl_model_known" },
      { label: "Forecast or model time series data", icon: "⟶", tag: "SEQUENTIAL", next: "ts_goal" },
      { label: "Learn from partially labeled data", icon: "½", tag: "SEMI-SUPERVISED", next: "ssl_type" },
      { label: "Run an experiment — A/B test or hypothesis test", icon: "⚖", tag: "STATS", next: "ab_goal" },
      { label: "Evaluate or interpret a model I've already trained", icon: "🔬", tag: "EVALUATION", next: "eval_task_type" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════
  clf_target_type: {
    question: "How many classes does your target variable have?",
    options: [
      { label: "Two classes  (binary)", icon: "◐", next: "clf_imbalance" },
      { label: "Three or more classes  (multiclass)", icon: "◉", next: "clf_multi_size" },
    ],
  },
  clf_imbalance: {
    question: "Is your dataset class-imbalanced?",
    subtitle: "Imbalanced = minority class makes up less than ~15% of rows.",
    options: [
      { label: "Yes — the positive class is rare", icon: "⚠", next: "clf_imb_size" },
      { label: "No — classes are roughly balanced", icon: "✓", next: "clf_bal_size" },
    ],
  },
  clf_imb_size: {
    question: "How large is your dataset?",
    options: [
      { label: "Small  (< 10k rows)", icon: "·", next: "leaf_clf_imb_small" },
      { label: "Medium  (10k – 500k rows)", icon: "··", next: "leaf_clf_imb_med" },
      { label: "Large  (> 500k rows)", icon: "···", next: "leaf_clf_imb_large" },
    ],
  },
  clf_bal_size: {
    question: "How large is your dataset?",
    options: [
      { label: "Small  (< 10k rows)", icon: "·", next: "leaf_clf_bal_small" },
      { label: "Medium  (10k – 500k rows)", icon: "··", next: "leaf_clf_bal_med" },
      { label: "Large  (> 500k rows)", icon: "···", next: "leaf_clf_bal_large" },
    ],
  },
  clf_multi_size: {
    question: "How large is your dataset?",
    options: [
      { label: "Small  (< 10k rows)", icon: "·", next: "leaf_clf_multi_small" },
      { label: "Medium / Large  (> 10k rows)", icon: "··", next: "leaf_clf_multi_large" },
    ],
  },

  // ── Classification Leaves ──────────────────────────────
  leaf_clf_imb_small: {
    models: ["Logistic Regression (class_weight='balanced')", "Naive Bayes (GaussianNB)", "SVM (RBF, class_weight='balanced')", "Random Forest (balanced)", "XGBoost (scale_pos_weight)"],
    primary: "Logistic Regression + SMOTE",
    notes: "Small + imbalanced is the hardest combination. Use SMOTE on the training set only. Naive Bayes is a surprisingly strong baseline for small data — fast and probabilistic. SVM with RBF kernel handles small datasets well when classes overlap.",
    tip: "Tune your decision threshold after training. Default 0.5 is almost never optimal for imbalanced data. Use the Precision-Recall curve to pick the threshold that matches your business cost of FP vs FN.",
    metrics: ["AUC-ROC", "F1 (minority class)", "Precision-Recall AUC", "CV stability across folds"],
    toolkit: "Notebook 05 (model training) + 06 (evaluation) in your DS Toolkit",
  },
  leaf_clf_imb_med: {
    models: ["XGBoost (scale_pos_weight)", "LightGBM (is_unbalance=True)", "Random Forest (class_weight='balanced')", "Logistic Regression (baseline)", "SVM (RBF) — if < 50k rows"],
    primary: "LightGBM or XGBoost",
    notes: "Gradient boosting handles imbalance natively via sample weighting. Set scale_pos_weight = n_negatives/n_positives in XGBoost; use is_unbalance=True in LightGBM. Always keep Logistic Regression as your interpretable baseline for comparison.",
    tip: "Set scale_pos_weight = n_negatives / n_positives in XGBoost. Use RandomizedSearchCV for tuning. SVM becomes slow above ~50k rows — prefer tree ensembles beyond that.",
    metrics: ["AUC-ROC", "KS Statistic", "Gini Coefficient", "Top-decile capture"],
    toolkit: "Notebook 05 in your DS Toolkit — already built for this exact scenario",
  },
  leaf_clf_imb_large: {
    models: ["LightGBM (fastest at scale)", "XGBoost", "Logistic Regression (baseline)"],
    primary: "LightGBM",
    notes: "At large scale, LightGBM's histogram-based algorithm is significantly faster than XGBoost. Avoid SVM entirely (O(n²) memory) and RandomForest (memory intensive). Use early stopping with a held-out validation set.",
    tip: "Use early stopping — set num_boost_round=9999 and early_stopping_rounds=50. LightGBM will stop when validation loss stops improving.",
    metrics: ["AUC-ROC", "Calibration (Brier Score)", "Inference latency", "Model size"],
    toolkit: null,
  },
  leaf_clf_bal_small: {
    models: ["Logistic Regression", "Naive Bayes (GaussianNB / MultinomialNB)", "KNN (k=5–15)", "SVM (RBF kernel)", "Decision Tree", "Random Forest"],
    primary: "Logistic Regression → SVM → Random Forest",
    notes: "Start simple. Naive Bayes is fast and works especially well for text features. KNN is non-parametric and needs no training — good when you have clean, low-dimensional features. SVM with RBF kernel is powerful for small, well-scaled datasets.",
    tip: "With small data, 5-fold stratified CV is essential. KNN requires StandardScaler first — it's extremely sensitive to feature scale. Naive Bayes assumes feature independence, so it breaks down with highly correlated features.",
    metrics: ["AUC-ROC", "F1 Score", "CV std across folds", "Confusion matrix"],
    toolkit: null,
  },
  leaf_clf_bal_med: {
    models: ["Logistic Regression (baseline)", "Random Forest", "Gradient Boosting (sklearn)", "LightGBM", "XGBoost", "SVM (RBF — if < 50k rows)"],
    primary: "LightGBM or XGBoost",
    notes: "This is the classic DS sweet spot. Run all five tree/boosting models, compare on validation AUC, tune the top two with RandomizedSearchCV. SVM is viable below ~50k rows but becomes slow above that.",
    tip: "This is exactly the workflow in your Loan Default DS Toolkit — notebooks 05 and 06 cover every model listed here with tuning already wired up.",
    metrics: ["AUC-ROC", "Precision-Recall AUC", "Confusion matrix at optimal threshold"],
    toolkit: "Notebooks 05 + 06 in your DS Toolkit",
  },
  leaf_clf_bal_large: {
    models: ["LightGBM", "XGBoost", "Logistic Regression (baseline)", "SGD Classifier (mini-batch)"],
    primary: "LightGBM",
    notes: "LightGBM is the workhorse for large-scale classification. SGD Classifier supports mini-batch training for datasets that don't fit in RAM. Avoid SVM — kernel SVMs scale as O(n²) to O(n³).",
    tip: "Consider mini-batch training via SGD or Dask-ML for very large datasets. LightGBM also supports distributed training.",
    metrics: ["AUC-ROC", "Inference latency", "Model size"],
    toolkit: null,
  },
  leaf_clf_multi_small: {
    models: ["Logistic Regression (multinomial/softmax)", "Naive Bayes", "KNN", "Decision Tree", "Random Forest"],
    primary: "Logistic Regression → Random Forest",
    notes: "Multi-class with small data: keep it simple. Naive Bayes is an excellent fast baseline. Logistic Regression with solver='lbfgs' handles multi-class natively via softmax. Beware of per-class imbalance — check each class's sample count.",
    tip: "Check the confusion matrix per class. Some classes may systematically confuse the model. Consider merging rare classes if their sample count is below ~30.",
    metrics: ["Macro F1", "Per-class precision & recall", "Confusion matrix"],
    toolkit: null,
  },
  leaf_clf_multi_large: {
    models: ["LightGBM (objective='multiclass')", "XGBoost (objective='multi:softmax')", "Random Forest", "Logistic Regression (baseline)"],
    primary: "LightGBM",
    notes: "Gradient boosting handles multi-class natively. Set objective='multiclass' and num_class in LightGBM. For 10+ classes, consider whether One-vs-Rest restructuring improves performance.",
    tip: "For 10+ classes, consider hierarchical classification: first predict a 'super-category', then fine-grain within it. Often beats flat multi-class on highly imbalanced label distributions.",
    metrics: ["Macro F1", "Weighted F1", "Top-k accuracy if applicable"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // REGRESSION
  // ═══════════════════════════════════════════════════════
  reg_target_count: {
    question: "What is the nature of your target variable?",
    options: [
      { label: "Single continuous number", icon: "∼", next: "reg_linearity" },
      { label: "Multiple continuous targets simultaneously", icon: "≋", next: "leaf_reg_multivariate" },
      { label: "Count data  (non-negative integers)", icon: "ℕ", next: "leaf_reg_count" },
      { label: "Bounded / proportion  (0 to 1)", icon: "%", next: "leaf_reg_bounded" },
    ],
  },
  reg_linearity: {
    question: "What kind of relationship do you expect between features and target?",
    options: [
      { label: "Mostly linear", icon: "⟋", next: "reg_linear_size" },
      { label: "Non-linear / complex interactions", icon: "⌇", next: "reg_nonlinear_size" },
      { label: "Many features  (> 50 columns)", icon: "≡", next: "leaf_reg_highdim" },
    ],
  },
  reg_linear_size: {
    question: "Dataset size?",
    options: [
      { label: "Small – Medium  (< 100k rows)", icon: "·", next: "leaf_reg_linear_small" },
      { label: "Large  (> 100k rows)", icon: "···", next: "leaf_reg_linear_large" },
    ],
  },
  reg_nonlinear_size: {
    question: "Dataset size?",
    options: [
      { label: "Small  (< 10k rows)", icon: "·", next: "leaf_reg_nl_small" },
      { label: "Medium – Large  (> 10k rows)", icon: "··", next: "leaf_reg_nl_large" },
    ],
  },

  // ── Regression Leaves ──────────────────────────────────
  leaf_reg_multivariate: {
    models: ["Multivariate Linear Regression", "MultiOutputRegressor (sklearn wrapper)", "Random Forest (multi-output)", "LightGBM (multi-output)", "Multivariate Adaptive Regression Splines (MARS)"],
    primary: "MultiOutputRegressor wrapping LightGBM",
    notes: "Multivariate regression predicts multiple continuous targets at once. sklearn's MultiOutputRegressor wraps any single-output regressor to handle multiple targets independently. If targets are correlated, fit a shared model — it may capture cross-target relationships.",
    tip: "Check target correlations first. If targets are highly correlated (|r| > 0.7), a single joint model often outperforms independent models. If uncorrelated, MultiOutputRegressor with LightGBM is your best default.",
    metrics: ["Per-target RMSE & MAE", "R² per target", "Joint RMSE"],
    toolkit: null,
  },
  leaf_reg_count: {
    models: ["Poisson Regression", "Negative Binomial Regression", "XGBoost (objective='count:poisson')", "Random Forest Regressor", "Zero-Inflated Poisson (if many zeros)"],
    primary: "Poisson Regression → XGBoost (count:poisson)",
    notes: "Count data (events, transactions, visits, defects) violates OLS assumptions. Variance typically grows with the mean — Poisson handles this. If Var(y) >> Mean(y), use Negative Binomial. If your data has excess zeros, use Zero-Inflated Poisson.",
    tip: "Check overdispersion: compute mean and variance of your target. If variance >> mean, Poisson will underfit — switch to Negative Binomial. Count > 0 always? That suggests zero-truncated Poisson.",
    metrics: ["Mean Poisson Deviance", "MAE", "RMSE"],
    toolkit: null,
  },
  leaf_reg_bounded: {
    models: ["Beta Regression", "Logistic Regression (as probability calibrator)", "Gradient Boosting + sigmoid transform", "Fractional Logit"],
    primary: "Beta Regression",
    notes: "Proportions strictly between 0 and 1 need models that respect the boundary. OLS will predict values outside [0,1]. Beta Regression is purpose-built for this.",
    tip: "Values exactly equal to 0 or 1 break Beta Regression (boundary singularity). Common fix: apply a small epsilon shift — e.g. y = (y * (n-1) + 0.5) / n.",
    metrics: ["MAE", "Brier Score", "Calibration curve"],
    toolkit: null,
  },
  leaf_reg_linear_small: {
    models: ["Linear Regression (OLS baseline)", "Ridge Regression (L2)", "Lasso Regression (L1)", "ElasticNet (L1 + L2)", "Bayesian Ridge"],
    primary: "Ridge → ElasticNet",
    notes: "Ridge adds L2 regularization (shrinks all coefficients — prevents overfitting). Lasso adds L1 (zeroes out irrelevant features — automatic feature selection). ElasticNet combines both. Always check residual plots for linearity assumption.",
    tip: "Always check residual plots after fitting. A U-shaped or funnel-shaped residual pattern means your linearity or homoscedasticity assumption is violated — consider transforming the target or switching to a non-linear model.",
    metrics: ["RMSE", "MAE", "R²", "Residual normality", "CV RMSE"],
    toolkit: null,
  },
  leaf_reg_linear_large: {
    models: ["Ridge Regression", "SGD Regressor (mini-batch)", "Stochastic Average Gradient (SAG)"],
    primary: "SGD Regressor",
    notes: "SGD Regressor supports mini-batch training — essential when data exceeds RAM. It approximates Ridge/Lasso via penalty parameter. Always standardize features first: SGD is highly sensitive to scale.",
    tip: "Set loss='squared_error' and penalty='l2' for Ridge-equivalent SGD. Use learning_rate='adaptive' for stable convergence. Standardize ALL features before fitting.",
    metrics: ["RMSE", "MAE", "R²"],
    toolkit: null,
  },
  leaf_reg_nl_small: {
    models: ["Decision Tree Regressor", "Random Forest Regressor", "SVR (RBF kernel)", "Polynomial Regression (degree 2–3)", "Gaussian Process Regression"],
    primary: "Random Forest Regressor",
    notes: "Random Forest is robust to outliers and requires no feature scaling. SVR (RBF) is powerful for small data with complex boundaries but requires careful hyperparameter tuning. Gaussian Process gives uncertainty estimates — valuable in scientific/engineering applications.",
    tip: "With small data and non-linear models, overfitting risk is high. Use 5-fold CV. For SVR, always scale features first — SVR is as scale-sensitive as KNN.",
    metrics: ["RMSE", "MAE", "R²", "CV RMSE std"],
    toolkit: null,
  },
  leaf_reg_nl_large: {
    models: ["LightGBM Regressor", "XGBoost Regressor", "Gradient Boosting Regressor (sklearn)", "Neural Network (MLP Regressor)"],
    primary: "LightGBM Regressor",
    notes: "Gradient boosting dominates tabular regression at scale. LightGBM is fastest. Neural nets (MLPs) only consistently beat gradient boosting on tabular data with 1M+ rows and complex feature interactions.",
    tip: "Set objective='regression' (LightGBM) or 'reg:squarederror' (XGBoost). Tune learning_rate and n_estimators together — lower LR needs more trees. Use early stopping.",
    metrics: ["RMSE", "MAE", "MAPE (if no zeros)", "R²"],
    toolkit: "Notebook 05 models apply here with objective change",
  },
  leaf_reg_highdim: {
    models: ["Lasso Regression (automatic feature selection)", "ElasticNet", "Ridge Regression", "Random Forest (check feature_importances_)", "PCA + Regression (pipeline)"],
    primary: "Lasso → ElasticNet",
    notes: "High-dimensional data (p >> 30) needs regularization or dimensionality reduction. Lasso zeroes out irrelevant coefficients automatically — giving you feature selection for free. PCA + Regression reduces dimensions before fitting.",
    tip: "Run Lasso first and inspect zero coefficients — they tell you which features to drop. After pruning, re-fit ElasticNet on the reduced set. Cross-validate the alpha parameter over a log scale.",
    metrics: ["RMSE", "MAE", "R²", "# non-zero coefficients"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // CLUSTERING
  // ═══════════════════════════════════════════════════════
  clu_know_k: {
    question: "Do you know how many clusters you want?",
    options: [
      { label: "Yes — I have a specific number in mind", icon: "✓", next: "clu_shape_known" },
      { label: "No — let the data determine the structure", icon: "?", next: "clu_hier_or_density" },
    ],
  },
  clu_shape_known: {
    question: "What shape do you expect the clusters to be?",
    options: [
      { label: "Roughly spherical / similar size", icon: "●", next: "leaf_clu_spherical" },
      { label: "Irregular, elongated, or arbitrary shape", icon: "⌘", next: "leaf_clu_irregular_known" },
    ],
  },
  clu_hier_or_density: {
    question: "What kind of structure are you looking for?",
    options: [
      { label: "Nested / hierarchical groupings (taxonomy-like)", icon: "🌿", next: "clu_hier_linkage" },
      { label: "Dense regions separated by sparse space", icon: "◌", next: "leaf_clu_density" },
      { label: "Soft / probabilistic cluster membership", icon: "◑", next: "leaf_clu_gmm" },
    ],
  },
  clu_hier_linkage: {
    question: "What linkage criterion best fits your data?",
    subtitle: "Linkage determines how inter-cluster distance is measured during merging.",
    options: [
      { label: "Ward — minimise within-cluster variance  (default, most common)", icon: "■", next: "leaf_clu_hier_ward" },
      { label: "Complete — use maximum pairwise distance  (compact clusters)", icon: "◆", next: "leaf_clu_hier_complete" },
      { label: "Average — use mean pairwise distance  (balanced)", icon: "◇", next: "leaf_clu_hier_average" },
      { label: "I'm not sure", icon: "?", next: "leaf_clu_hier_ward" },
    ],
  },

  // ── Clustering Leaves ──────────────────────────────────
  leaf_clu_spherical: {
    models: ["K-Means++", "K-Means", "Mini-Batch K-Means (large data > 100k rows)"],
    primary: "K-Means++",
    notes: "K-Means++ uses smarter centroid initialization than vanilla K-Means, avoiding most local optima. Mini-Batch K-Means is orders of magnitude faster on large datasets with a small accuracy trade-off.",
    tip: "Validate k using both the Elbow Method (inertia curve) AND the Silhouette Score — they sometimes recommend different values. Run K-Means++ 10 times and pick the run with the lowest inertia.",
    metrics: ["Silhouette Score", "Inertia (Elbow curve)", "Davies-Bouldin Index"],
    toolkit: null,
  },
  leaf_clu_irregular_known: {
    models: ["Spectral Clustering", "DBSCAN (treat k as reference)", "Agglomerative Clustering (complete/average linkage)", "Gaussian Mixture Models (if k known)"],
    primary: "Spectral Clustering",
    notes: "For non-spherical clusters when you know k, Spectral Clustering is the go-to. It uses the graph Laplacian to capture manifold structure. DBSCAN doesn't take k directly but you can tune eps to get approximately k clusters.",
    tip: "Spectral Clustering requires computing a similarity matrix — it becomes slow above ~10k rows. For larger datasets, use HDBSCAN or Agglomerative Clustering.",
    metrics: ["Silhouette Score", "Davies-Bouldin Index", "Visual inspection"],
    toolkit: null,
  },
  leaf_clu_density: {
    models: ["HDBSCAN (recommended)", "DBSCAN", "OPTICS"],
    primary: "HDBSCAN",
    notes: "HDBSCAN is a hierarchical extension of DBSCAN. It's more robust to parameter choice (only needs min_cluster_size), handles variable-density clusters, and explicitly marks noise points. DBSCAN requires careful tuning of eps and min_samples.",
    tip: "DBSCAN: use a k-distance plot to find eps — look for the 'elbow'. Set min_samples = 2 × n_features as a starting point. HDBSCAN: start with min_cluster_size = max(5, n_samples * 0.01).",
    metrics: ["DBCV (density-based validation)", "Silhouette Score", "% noise points", "Visual inspection"],
    toolkit: null,
  },
  leaf_clu_gmm: {
    models: ["Gaussian Mixture Model (GMM)", "Bayesian Gaussian Mixture Model (auto selects k)"],
    primary: "Bayesian GMM",
    notes: "GMM gives soft cluster assignments (each point has a probability of belonging to each cluster). Bayesian GMM automatically determines the effective number of components by shrinking unused components to zero.",
    tip: "Use BIC or AIC to select k for standard GMM: fit GMM for k=2..15, plot BIC vs k, pick the elbow. Bayesian GMM with a Dirichlet prior removes this step entirely.",
    metrics: ["BIC / AIC", "Log-likelihood", "Silhouette Score"],
    toolkit: null,
  },
  leaf_clu_hier_ward: {
    models: ["Agglomerative Clustering (Ward linkage)", "scipy.cluster.hierarchy (for dendrogram)"],
    primary: "Agglomerative Clustering — Ward",
    notes: "Ward linkage minimizes the total within-cluster variance at each merge step. It produces compact, equally-sized clusters and is the most commonly used linkage. The dendrogram shows all possible k — you cut it at the level that matches your desired number of clusters.",
    tip: "Use scipy.cluster.hierarchy.dendrogram() to visualize all possible cut levels before committing to k. Look for the longest vertical lines (large jumps in distance) — cutting there gives the most stable k.",
    metrics: ["Cophenetic correlation coefficient", "Silhouette Score", "Dendrogram inspection"],
    toolkit: null,
  },
  leaf_clu_hier_complete: {
    models: ["Agglomerative Clustering (complete linkage)", "scipy.cluster.hierarchy"],
    primary: "Agglomerative Clustering — Complete",
    notes: "Complete linkage uses the maximum distance between any two points across clusters. It produces compact, similarly-sized clusters and is resistant to outliers pulling clusters apart. Good when you expect tightly bounded groups.",
    tip: "Complete linkage is sensitive to outliers — a single extreme point can distort the merge order. Consider removing outliers with Isolation Forest before clustering.",
    metrics: ["Cophenetic correlation", "Silhouette Score", "Dendrogram inspection"],
    toolkit: null,
  },
  leaf_clu_hier_average: {
    models: ["Agglomerative Clustering (average linkage)", "scipy.cluster.hierarchy"],
    primary: "Agglomerative Clustering — Average",
    notes: "Average linkage uses the mean distance between all pairs of points across clusters. It balances between Ward (variance) and complete (max distance) and often produces natural-feeling groupings in biological or text data.",
    tip: "Average linkage with cosine distance works very well for text/document clustering. Combine with TF-IDF features for document grouping tasks.",
    metrics: ["Cophenetic correlation", "Silhouette Score", "Dendrogram inspection"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════
  ano_labels: {
    question: "Do you have labeled examples of anomalies?",
    options: [
      { label: "Yes — I have labeled normal and anomalous examples", icon: "✓", next: "ano_supervised_type" },
      { label: "No — fully unsupervised (anomalies unknown)", icon: "?", next: "ano_approach" },
      { label: "Time series data specifically", icon: "⟶", next: "ano_ts_method" },
    ],
  },
  ano_supervised_type: {
    question: "How severe is the class imbalance?",
    options: [
      { label: "Very imbalanced  (anomalies < 1% of data)", icon: "⚠", next: "leaf_ano_extreme_imb" },
      { label: "Moderately imbalanced  (1–15% anomalies)", icon: "·", next: "leaf_ano_moderate_imb" },
    ],
  },
  ano_approach: {
    question: "What type of anomaly detection do you need?",
    options: [
      { label: "Statistical — simple, interpretable thresholds", icon: "σ", next: "leaf_ano_statistical" },
      { label: "ML-based — capture complex patterns", icon: "◈", next: "leaf_ano_ml" },
      { label: "Autoencoder-based — high-dimensional / image data", icon: "⊛", next: "leaf_ano_autoencoder" },
    ],
  },
  ano_ts_method: {
    question: "What is your time series anomaly scenario?",
    options: [
      { label: "Point anomalies  (individual unusual values)", icon: "·", next: "leaf_ano_ts_point" },
      { label: "Contextual / pattern anomalies  (unusual given context)", icon: "⌇", next: "leaf_ano_ts_context" },
    ],
  },

  // ── Anomaly Detection Leaves ───────────────────────────
  leaf_ano_extreme_imb: {
    models: ["One-Class SVM", "Isolation Forest", "Autoencoder (reconstruction error threshold)", "Local Outlier Factor (LOF)"],
    primary: "Isolation Forest",
    notes: "With <1% anomalies, standard classifiers fail spectacularly. One-Class SVM learns the boundary of normal data. Isolation Forest isolates anomalies by random splits — anomalies require fewer splits. Autoencoder-based: train on normal data only; anomalies produce high reconstruction error.",
    tip: "Isolation Forest: set contamination to your estimated anomaly rate (e.g. 0.005 for 0.5%). One-Class SVM: nu parameter ≈ expected anomaly fraction. Always validate with domain experts — ground truth is scarce.",
    metrics: ["Precision@k", "Recall (anomaly class)", "F1 (anomaly class)", "AUC-ROC"],
    toolkit: null,
  },
  leaf_ano_moderate_imb: {
    models: ["XGBoost (scale_pos_weight)", "LightGBM (is_unbalance=True)", "Isolation Forest", "Random Forest (class_weight='balanced')"],
    primary: "XGBoost with scale_pos_weight",
    notes: "With 1–15% anomalies and labels, treat this as a heavily imbalanced classification problem. Gradient boosting with class weights outperforms most anomaly-specific algorithms when labels are available.",
    tip: "SMOTE + gradient boosting is a strong combination here. Generate synthetic minority samples in training only, then evaluate on unmodified test set.",
    metrics: ["F1 (anomaly class)", "Precision-Recall AUC", "AUC-ROC"],
    toolkit: "Notebook 05 (model training) — imbalanced classification path",
  },
  leaf_ano_statistical: {
    models: ["Z-Score (standard deviations from mean)", "Modified Z-Score (MAD-based, robust)", "IQR Rule (Tukey fences)", "Grubbs' Test (univariate)", "Mahalanobis Distance (multivariate)"],
    primary: "Z-Score → Modified Z-Score",
    notes: "Z-Score flags points beyond ±3 standard deviations. Modified Z-Score uses the Median Absolute Deviation (MAD) instead of mean/std — far more robust to existing outliers inflating the baseline. IQR rule uses Q1 - 1.5×IQR and Q3 + 1.5×IQR as fences. Mahalanobis distance handles multivariate outliers accounting for correlations.",
    tip: "Z-Score assumes Gaussian distribution. For skewed data, use Modified Z-Score or IQR. For multivariate data, Mahalanobis distance is the statistical gold standard — but requires invertible covariance matrix (n >> p).",
    metrics: ["Precision@k", "Number flagged", "False positive rate (if ground truth known)"],
    toolkit: null,
  },
  leaf_ano_ml: {
    models: ["Isolation Forest", "Local Outlier Factor (LOF)", "DBSCAN (outliers = noise points)", "One-Class SVM", "Elliptic Envelope (Gaussian assumption)"],
    primary: "Isolation Forest",
    notes: "Isolation Forest isolates anomalies using random feature splits — anomalies are isolated in fewer splits. LOF measures the local density deviation of a point relative to its neighbors. DBSCAN marks low-density points as noise (-1 label) — those are your anomalies.",
    tip: "Isolation Forest is the best default: fast, scalable, no distance computation. LOF is better for local anomalies in dense datasets. DBSCAN outlier detection: any point labeled -1 after DBSCAN is a candidate anomaly.",
    metrics: ["Silhouette-based scores", "Precision@k", "Visual inspection on PCA/UMAP projection"],
    toolkit: null,
  },
  leaf_ano_autoencoder: {
    models: ["Autoencoder (reconstruction error)", "Variational Autoencoder (VAE)", "LSTM Autoencoder (for sequences)"],
    primary: "Autoencoder",
    notes: "Train an Autoencoder on normal data only. Anomalies, being unlike training data, produce high reconstruction error. VAE learns a probabilistic latent space — the ELBO loss can serve as an anomaly score. LSTM Autoencoder is purpose-built for sequential / time series data.",
    tip: "Threshold reconstruction error at the 95th–99th percentile of validation error on known-normal data. VAE anomaly score = reconstruction loss + KL divergence. Monitor both components — KL divergence alone can catch semantic anomalies.",
    metrics: ["Reconstruction error distribution", "AUC-ROC (if labels available)", "Precision@k"],
    toolkit: null,
  },
  leaf_ano_ts_point: {
    models: ["Z-Score on rolling window", "IQR on rolling window", "Isolation Forest (with lag features)", "STL Decomposition + residual thresholding"],
    primary: "STL Decomposition + Z-Score on residuals",
    notes: "For point anomalies in time series, decompose the series into Trend + Seasonality + Residual (STL). Apply Z-Score or IQR thresholding on the residuals only — this removes seasonal and trend effects that would otherwise cause false positives.",
    tip: "Compute rolling mean and rolling std over a window (e.g. 7 or 30 periods). Flag points where |value - rolling_mean| > 3 × rolling_std. Window size should match your seasonal period.",
    metrics: ["Precision@k", "Recall", "F1 (if labeled)", "False alarm rate"],
    toolkit: null,
  },
  leaf_ano_ts_context: {
    models: ["LSTM Autoencoder", "Prophet residual analysis", "Matrix Profile (STUMPY)", "VAR model residuals (multivariate)"],
    primary: "LSTM Autoencoder",
    notes: "Contextual anomalies are sequences that are locally unusual even if individual values look normal. LSTM Autoencoder trains on normal sequences and flags high reconstruction error windows. Matrix Profile (STUMPY) is highly efficient for finding discord subsequences.",
    tip: "Define your anomaly window size before modeling. LSTM Autoencoder: train on sliding windows of length W. Flag windows where reconstruction error > μ + 3σ (computed on validation set).",
    metrics: ["Precision@k", "Recall", "Time-to-detect", "Visual inspection"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // DIMENSIONALITY REDUCTION
  // ═══════════════════════════════════════════════════════
  dim_goal: {
    question: "What is your goal for dimensionality reduction?",
    options: [
      { label: "Visualize high-dimensional data in 2D/3D", icon: "👁", next: "dim_viz_linear" },
      { label: "Preprocess / compress features for a downstream model", icon: "⇲", next: "dim_preprocess_labels" },
      { label: "Separate independent source signals", icon: "⟠", next: "leaf_dim_ica" },
      { label: "Select the most important features (keep originals)", icon: "✦", next: "leaf_dim_selection" },
    ],
  },
  dim_viz_linear: {
    question: "Do you expect the data to lie on a linear or non-linear manifold?",
    subtitle: "Linear = global structure matters. Non-linear = local neighborhood structure matters.",
    options: [
      { label: "Linear  (global variance structure)", icon: "⟋", next: "leaf_dim_pca_viz" },
      { label: "Non-linear  (local neighborhoods, clusters)", icon: "⌇", next: "leaf_dim_nonlinear_viz" },
    ],
  },
  dim_preprocess_labels: {
    question: "Do you have class labels for your data?",
    options: [
      { label: "Yes — supervised dimensionality reduction", icon: "✓", next: "leaf_dim_lda" },
      { label: "No — unsupervised compression", icon: "?", next: "leaf_dim_pca_preprocess" },
    ],
  },

  // ── Dimensionality Reduction Leaves ────────────────────
  leaf_dim_pca_viz: {
    models: ["PCA (Principal Component Analysis)", "Truncated SVD (sparse data)", "Factor Analysis"],
    primary: "PCA",
    notes: "PCA finds the directions of maximum variance. For visualization, project to 2–3 components. For preprocessing, choose components that explain 95%+ of variance. Truncated SVD is PCA for sparse matrices (e.g. text TF-IDF) — sklearn's TruncatedSVD is memory efficient.",
    tip: "Plot the explained variance ratio (scree plot). Pick components at the elbow. For visualization: project to PC1 and PC2. Color by class if labels exist — spatial separation indicates class-discriminative variance.",
    metrics: ["Explained variance ratio", "Cumulative variance at k components", "Reconstruction error"],
    toolkit: null,
  },
  leaf_dim_nonlinear_viz: {
    models: ["UMAP (Uniform Manifold Approximation)", "t-SNE (t-distributed Stochastic Neighbor Embedding)", "PHATE (trajectory data)", "Isomap", "Locally Linear Embedding (LLE)"],
    primary: "UMAP",
    notes: "UMAP is faster than t-SNE, preserves global structure better, and can be used for preprocessing (not just viz). t-SNE is excellent for revealing local cluster structure but is slow (O(n²)) and should only be used for visualization. Both are non-deterministic — set random_state for reproducibility.",
    tip: "UMAP: n_neighbors controls local vs global structure (5=local, 50=global). t-SNE: perplexity controls cluster spread (5–50, default 30). Never use t-SNE distances for downstream ML — the distances are not meaningful.",
    metrics: ["Visual cluster separation", "Trustworthiness score", "Continuity score"],
    toolkit: null,
  },
  leaf_dim_lda: {
    models: ["Linear Discriminant Analysis (LDA)", "PCA (then use class labels for validation)"],
    primary: "LDA",
    notes: "LDA finds the axes that maximize between-class separation while minimizing within-class scatter. It's both a classifier AND a dimensionality reduction technique. Max components = min(n_classes - 1, n_features). For binary classification: LDA reduces to a single discriminant axis.",
    tip: "LDA assumes Gaussian class distributions and equal covariance matrices. Violating these degrades performance. If assumptions are violated, use Quadratic Discriminant Analysis (QDA) or kernel LDA.",
    metrics: ["Between-class to within-class scatter ratio", "Classification accuracy on projected data"],
    toolkit: null,
  },
  leaf_dim_pca_preprocess: {
    models: ["PCA (Principal Component Analysis)", "Kernel PCA (non-linear)", "Autoencoder (deep non-linear compression)", "Truncated SVD (sparse matrices)"],
    primary: "PCA",
    notes: "PCA is the standard preprocessing step to reduce features before feeding into a classifier or regressor. Removes multicollinearity, reduces noise, speeds up training. Kernel PCA captures non-linear structure. Autoencoder learns a compressed latent representation — more expressive but requires more data.",
    tip: "Use sklearn Pipeline to chain PCA → classifier so the same PCA projection is applied consistently to train, val, and test. Never fit PCA on the test set.",
    metrics: ["Downstream model performance (RMSE/AUC)", "Explained variance ratio", "Training speed improvement"],
    toolkit: null,
  },
  leaf_dim_ica: {
    models: ["Independent Component Analysis (ICA — FastICA)", "Non-Negative Matrix Factorization (NMF)", "Sparse PCA"],
    primary: "FastICA",
    notes: "ICA separates a multivariate signal into additive, statistically independent non-Gaussian components. Classic use cases: blind source separation (separating mixed audio signals), EEG/fMRI signal decomposition, separating mixed financial time series. ICA maximizes non-Gaussianity (kurtosis/negentropy).",
    tip: "ICA assumes sources are statistically independent and non-Gaussian. It cannot recover the number of sources — you must specify n_components. Start with n_components = n_features, then reduce. FastICA from sklearn is the standard implementation.",
    metrics: ["Mutual information between components", "Kurtosis of extracted components", "Application-specific validation"],
    toolkit: null,
  },
  leaf_dim_selection: {
    models: ["Lasso (zero coefficient = remove feature)", "Random Forest feature_importances_", "SelectKBest (univariate F-test / mutual info)", "Recursive Feature Elimination (RFE)", "Boruta Algorithm"],
    primary: "Random Forest importance → RFE",
    notes: "Feature selection keeps original features (unlike PCA which creates new ones). Lasso zeroes irrelevant coefficients. Random Forest importances rank features by predictive value. RFE iteratively removes the weakest feature. Boruta is a robust all-relevant feature selection method based on Random Forest.",
    tip: "Use Boruta for a principled 'all-relevant' feature selection — it finds ALL features that carry information, not just the minimal set. For quick results, fit a Random Forest and inspect feature_importances_; drop features below the 10th percentile importance.",
    metrics: ["Model performance on selected features vs all features", "Number of features selected", "Stability across CV folds"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // ASSOCIATION RULE MINING
  // ═══════════════════════════════════════════════════════
  arm_datatype: {
    question: "What type of data are you mining patterns from?",
    options: [
      { label: "Transaction / market basket data  (items bought together)", icon: "🛒", next: "arm_scale" },
      { label: "Sequential / ordered data  (item sequences over time)", icon: "⟶", next: "leaf_arm_sequence" },
    ],
  },
  arm_scale: {
    question: "How large is your transaction database?",
    subtitle: "Apriori generates candidate itemsets explicitly — memory-intensive for large databases.",
    options: [
      { label: "Small – Medium  (< 100k transactions)", icon: "·", next: "leaf_arm_apriori" },
      { label: "Large  (> 100k transactions)", icon: "···", next: "leaf_arm_fpgrowth" },
    ],
  },

  // ── Association Rule Mining Leaves ─────────────────────
  leaf_arm_apriori: {
    models: ["Apriori Algorithm", "FP-Growth (faster alternative)", "Eclat Algorithm"],
    primary: "Apriori",
    notes: "Apriori generates frequent itemsets by level-wise candidate generation. It uses the anti-monotonicity property: if an itemset is infrequent, all its supersets are too. Simple to understand and implement. FP-Growth is generally faster even at small scale — use it if available.",
    tip: "Start with support=0.01 (1%) and confidence=0.5 (50%). Too high support = trivial rules. Too low = combinatorial explosion. Use mlxtend library: `from mlxtend.frequent_patterns import apriori, association_rules`.",
    metrics: ["Support", "Confidence", "Lift (> 1 = positive association)", "Conviction"],
    toolkit: null,
  },
  leaf_arm_fpgrowth: {
    models: ["FP-Growth (Frequent Pattern Growth)", "FP-Max (maximal frequent itemsets)", "H-Mine (memory-efficient)"],
    primary: "FP-Growth",
    notes: "FP-Growth avoids candidate generation entirely by building a compressed FP-tree structure. It scans the database only twice. Much faster and more memory-efficient than Apriori for large transaction databases. Scales to millions of transactions.",
    tip: "FP-Growth: use mlxtend's `fpgrowth()` — it's the fastest Python implementation. For very large datasets, use Spark MLlib's FPGrowth which distributes computation. Always filter low-support rules first — high-lift but low-support rules are usually noise.",
    metrics: ["Support", "Confidence", "Lift", "# rules generated", "Rule diversity"],
    toolkit: null,
  },
  leaf_arm_sequence: {
    models: ["PrefixSpan (Prefix-projected Sequential pattern mining)", "GSP (Generalized Sequential Patterns)", "SPADE", "cSPADE"],
    primary: "PrefixSpan",
    notes: "Sequential pattern mining finds ordered sequences that appear frequently (e.g. 'users who buy A then B then C'). PrefixSpan uses prefix-projection to avoid candidate generation — the most efficient sequential pattern algorithm. Different from association rules: order matters here.",
    tip: "PrefixSpan is available in the SPMF library (Java, also Python wrapper). Define minimum support carefully — sequences are sparser than itemsets, so lower support thresholds are needed.",
    metrics: ["Support of sequences", "# patterns found", "Average sequence length"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // DEEP LEARNING
  // ═══════════════════════════════════════════════════════
  dl_modality: {
    question: "What type of data will your model process?",
    options: [
      { label: "Images / video", icon: "🖼", next: "dl_image_task" },
      { label: "Text / natural language", icon: "Aa", next: "dl_text_task" },
      { label: "Sequences / time series / audio", icon: "⟶", next: "leaf_dl_rnn" },
      { label: "Tabular / structured data", icon: "⊞", next: "leaf_dl_tabular" },
      { label: "Compression / generation / reconstruction", icon: "⊛", next: "leaf_dl_autoencoder" },
    ],
  },
  dl_image_task: {
    question: "What is your image task?",
    options: [
      { label: "Classification  (what is in the image?)", icon: "⬡", next: "leaf_dl_cnn_clf" },
      { label: "Detection / segmentation  (where are objects?)", icon: "◻", next: "leaf_dl_cnn_detect" },
      { label: "Generation  (create new images)", icon: "✦", next: "leaf_dl_image_gen" },
    ],
  },
  dl_text_task: {
    question: "What is your NLP task?",
    options: [
      { label: "Classification  (sentiment, topic, intent)", icon: "⬡", next: "leaf_dl_bert_clf" },
      { label: "Generation / completion / summarization", icon: "✦", next: "leaf_dl_gpt" },
      { label: "Named entity recognition / sequence labeling", icon: "≡", next: "leaf_dl_ner" },
      { label: "Embeddings / semantic similarity", icon: "◎", next: "leaf_dl_embeddings" },
    ],
  },

  // ── Deep Learning Leaves ───────────────────────────────
  leaf_dl_cnn_clf: {
    models: ["ResNet-50 / ResNet-101 (transfer learning)", "EfficientNet (best accuracy/compute ratio)", "VGG-16 (simpler, for small datasets)", "MobileNet (lightweight / mobile)", "Vision Transformer (ViT — large datasets)"],
    primary: "EfficientNet-B0 with transfer learning",
    notes: "Never train a CNN from scratch unless you have 100k+ labeled images per class. Use transfer learning: load ImageNet pretrained weights, freeze early layers, fine-tune the last 2–3 layers on your data. EfficientNet gives the best accuracy-to-compute trade-off.",
    tip: "Transfer learning recipe: (1) Load EfficientNet with imagenet weights. (2) Freeze all layers. (3) Add custom head (GlobalAveragePooling → Dense → Softmax). (4) Train head only for 5 epochs. (5) Unfreeze last block, fine-tune at 10× lower LR.",
    metrics: ["Top-1 Accuracy", "Top-5 Accuracy", "Confusion matrix per class", "AUC-ROC"],
    toolkit: null,
  },
  leaf_dl_cnn_detect: {
    models: ["YOLO v8 / v9 (real-time detection)", "Faster R-CNN (higher accuracy)", "Mask R-CNN (instance segmentation)", "SAM — Segment Anything Model (zero-shot segmentation)"],
    primary: "YOLO v8",
    notes: "YOLO v8 is the current best balance of speed and accuracy for object detection. Faster R-CNN is slower but more accurate for small object detection. Mask R-CNN extends Faster R-CNN to pixel-level instance segmentation. SAM (Meta) is remarkable for zero-shot segmentation without fine-tuning.",
    tip: "YOLO v8 supports classification, detection, and segmentation in one codebase (ultralytics library). For custom datasets, fine-tune on as few as 300 annotated images per class. Use Roboflow for annotation + augmentation.",
    metrics: ["mAP@0.5", "mAP@0.5:0.95", "FPS (inference speed)", "IoU per class"],
    toolkit: null,
  },
  leaf_dl_image_gen: {
    models: ["Stable Diffusion (text-to-image fine-tuning)", "GAN — StyleGAN3 (face/texture synthesis)", "VAE (structured latent space)", "Diffusion Models (DDPM, DDIM)"],
    primary: "Stable Diffusion fine-tuning (DreamBooth / LoRA)",
    notes: "For custom image generation, fine-tune Stable Diffusion using DreamBooth (high quality, high compute) or LoRA (faster, less memory). GAN training is notoriously unstable — prefer diffusion models for new projects. VAE gives a structured, interpolable latent space.",
    tip: "LoRA (Low-Rank Adaptation) lets you fine-tune Stable Diffusion on ~20–30 images of a concept with consumer GPU memory (16GB). DreamBooth requires more compute but produces higher fidelity. Use Hugging Face Diffusers library.",
    metrics: ["FID (Fréchet Inception Distance)", "IS (Inception Score)", "CLIP Score (text-image alignment)", "Human evaluation"],
    toolkit: null,
  },
  leaf_dl_bert_clf: {
    models: ["BERT (bert-base-uncased)", "RoBERTa (more robust BERT)", "DistilBERT (faster, lighter)", "DeBERTa (state-of-the-art)", "domain-specific BERT (FinBERT, BioBERT, etc.)"],
    primary: "DistilBERT (fast) or DeBERTa (best accuracy)",
    notes: "For text classification, fine-tune a pretrained BERT-family model. DistilBERT is 40% smaller and 60% faster than BERT with 97% of its performance. DeBERTa achieves state-of-the-art on most benchmarks. Use domain-specific variants if your text is specialized (financial, medical, legal).",
    tip: "Fine-tuning recipe: 3–5 epochs, lr=2e-5, batch_size=16–32. Use Hugging Face Trainer API. With <500 labeled examples, try few-shot prompting via the Anthropic API before fine-tuning — often competitive with full fine-tuning at a fraction of the cost.",
    metrics: ["Accuracy", "Macro F1", "Per-class precision & recall"],
    toolkit: null,
  },
  leaf_dl_gpt: {
    models: ["GPT-4 / Claude (API — via prompt engineering)", "LLaMA 3 / Mistral (open-source, self-hosted)", "T5 / Flan-T5 (seq2seq, summarization)", "GPT-2 (small-scale fine-tuning)"],
    primary: "Anthropic Claude API (prompt engineering first)",
    notes: "For text generation, summarization, and completion: start with API-based models (Claude, GPT-4) via prompt engineering before fine-tuning. Fine-tuning is only worth it when you need consistent style/format, domain-specific knowledge, or latency/cost at high volume.",
    tip: "Before fine-tuning, try: (1) zero-shot prompting, (2) few-shot prompting with 3–5 examples, (3) chain-of-thought prompting. 80% of use cases are solved at step 1 or 2. Fine-tuning is the last resort, not the first step.",
    metrics: ["ROUGE (summarization)", "BLEU (translation)", "BERTScore (semantic similarity)", "Human evaluation"],
    toolkit: null,
  },
  leaf_dl_ner: {
    models: ["BERT + TokenClassification head (fine-tuned)", "spaCy NER (pretrained + custom)", "Flair (character-level + contextual)", "CRF + hand-crafted features (lightweight baseline)"],
    primary: "BERT TokenClassification (Hugging Face)",
    notes: "NER and sequence labeling treat each token as a classification target (BIO tagging scheme). Fine-tuned BERT with a TokenClassification head is the current standard. spaCy provides production-ready NER with fast inference.",
    tip: "Use IOB2 (BIO) tagging: B-TYPE = beginning of entity, I-TYPE = inside entity, O = outside. Hugging Face's token-classification pipeline handles this automatically. For custom entities, annotate 500–1000 sentences minimum.",
    metrics: ["Entity-level F1", "Precision & recall per entity type", "Exact match vs partial match"],
    toolkit: null,
  },
  leaf_dl_embeddings: {
    models: ["Sentence-BERT (sentence-transformers library)", "OpenAI text-embedding-ada-002", "E5 / BGE (state-of-the-art open embeddings)", "Universal Sentence Encoder (USE)"],
    primary: "Sentence-BERT (all-MiniLM-L6-v2)",
    notes: "For semantic similarity, clustering text, semantic search, or retrieval — use embedding models. Sentence-BERT maps sentences to dense vectors where cosine similarity reflects semantic similarity. all-MiniLM-L6-v2 is fast and high quality. For highest quality: use Anthropic's or OpenAI's embedding API.",
    tip: "Cosine similarity is the right distance metric for embeddings — NOT euclidean. For semantic search at scale, use FAISS or Chroma vector database for efficient nearest-neighbor lookup over millions of embeddings.",
    metrics: ["Cosine similarity distribution", "Retrieval precision@k", "BEIR benchmark score"],
    toolkit: null,
  },
  leaf_dl_rnn: {
    models: ["LSTM (Long Short-Term Memory)", "GRU (Gated Recurrent Unit — faster than LSTM)", "Bidirectional LSTM", "Temporal Convolutional Network (TCN)", "Transformer (for longer sequences)"],
    primary: "GRU or Bidirectional LSTM",
    notes: "GRU is simpler and faster than LSTM with comparable performance on most sequence tasks. Bidirectional LSTM processes sequences in both directions — excellent for classification where the full context is available. For very long sequences (> 500 steps), Transformers outperform RNNs due to attention mechanism.",
    tip: "GRU training tip: use dropout=0.2 between layers and recurrent_dropout=0.2 within cells. Clip gradients to norm 1.0 to prevent exploding gradients. Bidirectional: set merge_mode='concat' for richest representation.",
    metrics: ["Accuracy / F1 (classification)", "RMSE / MAE (regression)", "Perplexity (language modeling)"],
    toolkit: null,
  },
  leaf_dl_tabular: {
    models: ["TabNet (attention-based tabular DL)", "NODE (Neural Oblivious Decision Ensembles)", "MLP with batch normalization", "FT-Transformer (Feature Tokenizer + Transformer)"],
    primary: "MLP with batch normalization (then TabNet if MLP underperforms)",
    notes: "Deep learning on tabular data often underperforms gradient boosting (LightGBM/XGBoost) — especially with < 100k rows. Only choose deep learning for tabular data when: (1) you have > 100k rows, (2) you need joint training with other modalities, or (3) interpretability via attention is required.",
    tip: "Before building a tabular DL model, benchmark against LightGBM first. If LightGBM wins, stop. If DL is needed, TabNet's sparse attention provides built-in feature selection and interpretability.",
    metrics: ["AUC-ROC / RMSE vs LightGBM baseline", "Feature attention weights", "Training stability"],
    toolkit: null,
  },
  leaf_dl_autoencoder: {
    models: ["Autoencoder (compression / denoising)", "Variational Autoencoder (VAE — generative)", "Masked Autoencoder (MAE — self-supervised)", "Denoising Autoencoder"],
    primary: "Autoencoder (standard) or VAE (if generation needed)",
    notes: "Autoencoders learn a compressed latent representation by reconstructing input through a bottleneck. Standard Autoencoder: deterministic compression. VAE: probabilistic latent space — enables sampling and interpolation. Denoising Autoencoder: trained to reconstruct from corrupted input — learns robust features. MAE: mask 75% of input patches and reconstruct — powerful self-supervised pretraining.",
    tip: "VAE training: weight the KL divergence term (β-VAE): Loss = Reconstruction + β×KL. β=1 is standard; β>1 promotes disentanglement. Use reconstruction error from a trained Autoencoder as an anomaly score — no labels needed.",
    metrics: ["Reconstruction loss (MSE / BCE)", "FID (if generative)", "ELBO (VAE)", "Downstream task performance on learned representations"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // REINFORCEMENT LEARNING
  // ═══════════════════════════════════════════════════════
  rl_model_known: {
    question: "Do you have access to a model (transition function) of the environment?",
    subtitle: "A 'model' means you can predict the next state and reward given a current state and action — without interacting with the real environment.",
    options: [
      { label: "Yes — I have or can build a model of the environment", icon: "✓", next: "rl_model_given_or_learned" },
      { label: "No — agent must learn purely from interaction", icon: "?", next: "rl_free_value_or_policy" },
    ],
  },
  rl_model_given_or_learned: {
    question: "Is the environment model given to you, or must the agent learn it?",
    options: [
      { label: "Given / known  (e.g. chess rules, simulator)", icon: "📐", next: "leaf_rl_given_model" },
      { label: "Must be learned from experience", icon: "🧠", next: "leaf_rl_learn_model" },
    ],
  },
  rl_free_value_or_policy: {
    question: "What kind of model-free RL approach fits your problem?",
    subtitle: "Value-based: learn how good each state/action is. Policy-based: directly learn the best action to take.",
    options: [
      { label: "Value-based  (discrete actions, simpler environments)", icon: "⬡", next: "leaf_rl_value_based" },
      { label: "Policy-based  (continuous actions or complex policies)", icon: "⟳", next: "leaf_rl_policy_based" },
      { label: "Actor-Critic  (combines both — most modern RL)", icon: "◈", next: "leaf_rl_actor_critic" },
    ],
  },

  // ── RL Leaves ──────────────────────────────────────────
  leaf_rl_given_model: {
    models: ["Value Iteration (tabular)", "Policy Iteration (tabular)", "MCTS — Monte Carlo Tree Search (planning)", "AlphaZero-style (MCTS + deep network)", "MuZero (learns value/policy without explicit rules)"],
    primary: "MCTS for planning; AlphaZero-style for learning",
    notes: "When the model is given (e.g. game rules, known simulator), you can plan without interacting with the environment. Value/Policy Iteration are exact dynamic programming solutions for small state spaces. MCTS scales to large state spaces by sampling. AlphaZero combines MCTS with a deep neural network for value and policy estimation.",
    tip: "Value Iteration: iterate V(s) = max_a [R(s,a) + γ Σ P(s'|s,a)V(s')] until convergence. Practical for < ~10k states. For larger spaces, use approximate methods (fitted value iteration) or MCTS.",
    metrics: ["Cumulative reward", "Win rate (games)", "Planning depth reached", "Convergence steps"],
    toolkit: null,
  },
  leaf_rl_learn_model: {
    models: ["Dyna-Q (tabular model learning + planning)", "World Models (Ha & Schmidhuber)", "MuZero (learns model implicitly)", "DreamerV3 (world model + actor-critic in latent space)"],
    primary: "DreamerV3 (best current model-based RL)",
    notes: "Model-Based RL learns a transition model from experience, then plans using that model. This dramatically improves sample efficiency — you can 'imagine' trajectories without real interactions. DreamerV3 is the current state-of-the-art: learns a world model in a compact latent space, then trains actor-critic entirely through imagination.",
    tip: "Dyna-Q: after each real experience, run k simulated planning steps using the learned model. k=5–50 typically gives 5–50× sample efficiency improvement over pure Q-learning. More model-based planning = better sample efficiency but higher compute.",
    metrics: ["Sample efficiency (reward per environment step)", "Cumulative reward", "Model prediction accuracy"],
    toolkit: null,
  },
  leaf_rl_value_based: {
    models: ["Q-Learning (tabular)", "Deep Q-Network (DQN)", "Double DQN (reduces overestimation)", "Dueling DQN", "Rainbow DQN (combines all improvements)"],
    primary: "Double DQN → Rainbow DQN",
    notes: "Q-Learning learns the value Q(s,a) of taking action a in state s. DQN extends Q-Learning with a neural network function approximator and experience replay. Double DQN fixes Q-Learning's overestimation bias. Rainbow combines Double DQN + Dueling + Prioritized Replay + multi-step returns + distributional RL + Noisy Nets.",
    tip: "DQN recipe: (1) Experience replay buffer (50k–1M transitions). (2) Target network updated every 1000 steps. (3) ε-greedy exploration: start ε=1.0, decay to 0.01. (4) Reward clipping to [-1, +1] for stability. Use stable-baselines3 library for robust implementations.",
    metrics: ["Cumulative reward per episode", "Average Q-value", "Episodes to convergence", "Evaluation reward (greedy policy)"],
    toolkit: null,
  },
  leaf_rl_policy_based: {
    models: ["REINFORCE (vanilla policy gradient)", "PPO — Proximal Policy Optimization (most practical)", "TRPO — Trust Region Policy Optimization (more stable)", "SAC — Soft Actor-Critic (continuous actions)"],
    primary: "PPO (most widely used in practice)",
    notes: "Policy gradient methods directly optimize the policy π(a|s). REINFORCE is simple but high variance. PPO clips the policy update to prevent large destabilizing steps — the most widely used algorithm in practice (used by OpenAI for ChatGPT RLHF training). TRPO is more principled but harder to implement.",
    tip: "PPO hyperparameters: clip_range=0.2, n_steps=2048, batch_size=64, n_epochs=10, learning_rate=3e-4, entropy_coef=0.01. Use stable-baselines3's PPO implementation — it handles vectorized environments and handles most implementation details correctly.",
    metrics: ["Cumulative reward", "Policy entropy (exploration)", "KL divergence per update", "Episodes to solve"],
    toolkit: null,
  },
  leaf_rl_actor_critic: {
    models: ["A2C / A3C — Advantage Actor-Critic", "PPO (actor-critic variant — most practical)", "SAC — Soft Actor-Critic (off-policy, continuous actions)", "TD3 — Twin Delayed DDPG (robotic control)"],
    primary: "PPO (discrete) or SAC (continuous actions)",
    notes: "Actor-Critic combines value learning (critic) and policy learning (actor). The critic reduces policy gradient variance. SAC is the best off-policy algorithm for continuous action spaces (robotics, physics simulation). TD3 is SAC's predecessor — slightly simpler. A3C uses asynchronous parallel workers.",
    tip: "SAC for continuous control: it maximizes reward + entropy (temperature α). High entropy = exploration. Low entropy = exploitation. Use automatic temperature tuning (set target_entropy=-dim(action_space)). SAC is generally more sample efficient than PPO for continuous action spaces.",
    metrics: ["Cumulative reward", "Policy entropy", "Critic loss convergence", "Evaluation return (deterministic policy)"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // TIME SERIES
  // ═══════════════════════════════════════════════════════
  ts_goal: {
    question: "What are you trying to do with your time series data?",
    options: [
      { label: "Forecast future values", icon: "→", next: "ts_freq" },
      { label: "Classify time windows or patterns", icon: "⬡", next: "leaf_ts_classify" },
      { label: "Detect anomalies in time series", icon: "⚠", next: "ano_ts_method" },
    ],
  },
  ts_freq: {
    question: "What best describes your forecasting scenario?",
    options: [
      { label: "Low frequency — daily/weekly/monthly, few series", icon: "📅", next: "leaf_ts_classic" },
      { label: "High frequency or many parallel series", icon: "⚡", next: "leaf_ts_ml" },
      { label: "Long-range dependencies / complex patterns", icon: "⌇", next: "leaf_ts_deep" },
    ],
  },

  // ── Time Series Leaves ─────────────────────────────────
  leaf_ts_classic: {
    models: ["Prophet (Facebook/Meta)", "ARIMA / SARIMA", "Exponential Smoothing (ETS / Holt-Winters)", "Theta Model", "TBATS (multiple seasonalities)"],
    primary: "Prophet → ARIMA",
    notes: "For daily/weekly/monthly business time series, Prophet handles seasonality, holidays, and trend changepoints automatically. ARIMA is the statistical gold standard — interpretable and rigorous. SARIMA adds seasonal differencing. ETS/Holt-Winters works well for data with stable trend and seasonality.",
    tip: "Check stationarity before ARIMA (ADF test). Difference the series if it trends. Use ACF/PACF plots to identify AR and MA orders. Prophet requires minimal tuning — a strong first choice for business forecasting.",
    metrics: ["MAE", "RMSE", "MAPE", "Coverage (prediction interval width vs actual)"],
    toolkit: null,
  },
  leaf_ts_ml: {
    models: ["LightGBM with lag features", "XGBoost with lag features", "Random Forest (lag features)", "N-BEATS", "N-HiTS"],
    primary: "LightGBM with engineered lag features",
    notes: "Transform the time series into a supervised ML problem using lag features, rolling statistics, and calendar features. Gradient boosting then matches or beats classical methods at scale and handles multiple series naturally. N-BEATS and N-HiTS are purpose-built neural forecasters.",
    tip: "Feature engineering is everything: lag_1, lag_7, lag_30, rolling_mean_7, rolling_std_14, day_of_week, month, is_holiday, is_weekend. Add Fourier terms for complex seasonality. Use time-series CV (expanding window, not random split).",
    metrics: ["MAE", "RMSE", "SMAPE", "Directional accuracy"],
    toolkit: "Adapt notebook 05 — change X/y to lag-feature matrix",
  },
  leaf_ts_deep: {
    models: ["Temporal Fusion Transformer (TFT)", "N-HiTS", "PatchTST (Transformer)", "LSTM / GRU", "Informer (long-range attention)"],
    primary: "Temporal Fusion Transformer",
    notes: "TFT (Google) is the leading deep learning forecaster: combines LSTM with multi-head self-attention and interpretable variable selection. PatchTST applies Vision Transformer-style patch processing to time series. Use deep models when: many series, long lookback windows, or complex inter-series dependencies.",
    tip: "TFT requires covariate information to really shine — add known future covariates (calendar features, planned events) alongside the target. Use pytorch-forecasting library for a production-ready TFT implementation.",
    metrics: ["MAE", "RMSE", "sMAPE", "WQL (Weighted Quantile Loss for probabilistic forecasts)"],
    toolkit: null,
  },
  leaf_ts_classify: {
    models: ["Rocket / MiniRocket (state-of-the-art)", "Random Forest on hand-crafted features", "LSTM / GRU", "1D CNN", "InceptionTime (deep TS classifier)"],
    primary: "Rocket / MiniRocket",
    notes: "For classifying time windows (ECG, sensor readings, audio segments), Rocket uses random convolutional kernels — fast, accurate, and scalable. Extract features from windows (mean, std, min, max, autocorrelation, FFT) and apply a standard classifier as baseline.",
    tip: "Rocket is available in sktime library. MiniRocket is 75× faster than Rocket with similar accuracy. Extract sliding windows with appropriate overlap (50% is standard). Always normalize each window independently.",
    metrics: ["Accuracy", "F1 per class", "AUC-ROC"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // SEMI-SUPERVISED
  // ═══════════════════════════════════════════════════════
  ssl_type: {
    question: "What best describes your labeled data situation?",
    options: [
      { label: "Small labeled set, large unlabeled set — propagate labels", icon: "⇢", next: "leaf_ssl_propagation" },
      { label: "Train on labeled, iteratively label unlabeled", icon: "⟳", next: "leaf_ssl_self_training" },
      { label: "Two views or feature sets of the same instances", icon: "⊕", next: "leaf_ssl_cotraining" },
      { label: "Pretrain on unlabeled, fine-tune on labeled", icon: "⬆", next: "leaf_ssl_pretrain" },
    ],
  },

  // ── Semi-supervised Leaves ─────────────────────────────
  leaf_ssl_propagation: {
    models: ["Label Propagation", "Label Spreading (more robust)", "Graph Neural Networks (GNN — if graph structure available)"],
    primary: "Label Spreading",
    notes: "Label Propagation and Label Spreading use the graph structure of all data to propagate labels from labeled to unlabeled nodes. Label Spreading is more robust — it allows labels to slightly change during propagation (reduces sensitivity to noisy labels). Works best when labeled and unlabeled data share the same underlying distribution.",
    tip: "Label Spreading is preferred over Label Propagation when you have noisy labeled data — the alpha parameter (0–1) controls how much labels can change. Start with alpha=0.2. Build the affinity graph using RBF kernel: exp(-||xi - xj||² / σ²).",
    metrics: ["Accuracy on held-out labeled set", "Label consistency across propagation", "Transductive accuracy"],
    toolkit: null,
  },
  leaf_ssl_self_training: {
    models: ["Self-Training Classifier (sklearn)", "Pseudo-Labeling (predict → add high-confidence → retrain)", "Mean Teacher", "Noisy Student Training"],
    primary: "Self-Training Classifier (sklearn)",
    notes: "Self-training trains on labeled data, predicts unlabeled data, adds high-confidence predictions as pseudo-labels, retrains. Iterates. Pseudo-labeling is the same concept. Mean Teacher uses an exponential moving average of model weights as a more stable teacher. Noisy Student adds data augmentation noise during student training.",
    tip: "Only add predictions with confidence > 0.9 (or top-k% most confident). Adding uncertain pseudo-labels degrades performance. Use probability calibration (Platt scaling) before thresholding — raw model probabilities are often overconfident.",
    metrics: ["Accuracy on held-out labeled set", "Pseudo-label quality (% correct if verifiable)", "Performance vs fully-supervised baseline"],
    toolkit: null,
  },
  leaf_ssl_cotraining: {
    models: ["Co-Training (Blum & Mitchell)", "Co-Forest", "Democratic Co-Learning"],
    primary: "Co-Training",
    notes: "Co-Training trains two independent classifiers on two different 'views' (feature subsets) of the data. Each classifier labels unlabeled examples for the other based on its confident predictions. Requires two views that are: (1) sufficient for classification individually, (2) conditionally independent given the class label.",
    tip: "Natural co-training views: for webpages — text content vs hyperlink anchor text; for multimodal — image features vs text description. If you don't have natural views, randomly split features into two halves (weaker but still useful).",
    metrics: ["Accuracy on held-out labeled set", "Agreement between the two classifiers", "Learning curve vs number of labeled examples"],
    toolkit: null,
  },
  leaf_ssl_pretrain: {
    models: ["BERT / RoBERTa (pretrain on text, fine-tune)", "SimCLR / MoCo (contrastive learning for images)", "MAE — Masked Autoencoder (self-supervised vision)", "DINO (self-supervised ViT)"],
    primary: "Domain-matched pretrained model + fine-tuning",
    notes: "Pretraining on a large unlabeled corpus then fine-tuning on a small labeled set is the dominant paradigm in NLP and CV. For text: use a pretrained BERT/RoBERTa. For images: pretrained ResNet or ViT. Contrastive learning (SimCLR, MoCo) pretrains visual representations without labels.",
    tip: "Always use the smallest pretrained model that achieves acceptable performance — DistilBERT vs BERT vs DeBERTa. More parameters = more overfitting risk on small fine-tuning sets. Use data augmentation aggressively during fine-tuning.",
    metrics: ["Fine-tuning accuracy / F1", "Few-shot accuracy at various label sizes (1%, 5%, 10%)", "Transfer efficiency"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // A/B TESTING & EXPERIMENTS
  // ═══════════════════════════════════════════════════════
  ab_goal: {
    question: "What are you trying to compare or test?",
    subtitle: "A/B testing fits broadly — it means comparing two or more variants with statistical rigor.",
    options: [
      { label: "Compare two group means  (e.g. revenue, time on site)", icon: "μ", next: "ab_mean_paired" },
      { label: "Compare proportions / conversion rates", icon: "%", next: "ab_proportion_n" },
      { label: "Compare more than two groups", icon: "≡", next: "leaf_ab_anova" },
      { label: "Compare ML model performance (AUC, RMSE, etc.)", icon: "◈", next: "leaf_ab_ml_compare" },
      { label: "Measure uplift / causal treatment effect", icon: "⬆", next: "leaf_ab_uplift" },
      { label: "How large does my sample need to be?", icon: "n", next: "leaf_ab_power" },
    ],
  },
  ab_mean_paired: {
    question: "Is the data paired or independent?",
    subtitle: "Paired = same subjects measured twice (before/after). Independent = separate control and treatment groups.",
    options: [
      { label: "Independent groups  (separate control vs treatment)", icon: "∥", next: "ab_mean_normal" },
      { label: "Paired / repeated measures  (same subjects, two conditions)", icon: "⇄", next: "leaf_ab_paired_t" },
    ],
  },
  ab_mean_normal: {
    question: "Is your metric approximately normally distributed?",
    subtitle: "Check: histogram roughly bell-shaped, or n > 30 per group (CLT applies).",
    options: [
      { label: "Yes — normal distribution or large sample (n > 30)", icon: "∿", next: "leaf_ab_ttest" },
      { label: "No — skewed, ordinal, or small sample", icon: "⌇", next: "leaf_ab_nonparam" },
    ],
  },
  ab_proportion_n: {
    question: "What is your preferred statistical framework?",
    options: [
      { label: "Frequentist  (p-values, confidence intervals)", icon: "σ", next: "leaf_ab_proportion_freq" },
      { label: "Bayesian  (probability treatment is better)", icon: "β", next: "leaf_ab_proportion_bayes" },
    ],
  },

  // ── A/B Leaves ─────────────────────────────────────────
  leaf_ab_ttest: {
    models: ["Two-sample independent t-test (Welch's)", "Z-test (if n > 100 per group)", "Bootstrap confidence interval"],
    primary: "Welch's t-test",
    notes: "Welch's t-test is preferred over Student's t-test because it does not assume equal variances. Z-test is appropriate when n > 100 per group (standard error estimate is stable). Bootstrap CI makes no distributional assumptions and works on any metric.",
    tip: "Always report effect size (Cohen's d), not just p-value. d = (mean_A - mean_B) / pooled_std. d=0.2 small, d=0.5 medium, d=0.8 large. A statistically significant result with d=0.01 is practically useless. Use scipy.stats.ttest_ind(equal_var=False) for Welch's.",
    metrics: ["p-value (threshold: 0.05 or 0.01)", "95% Confidence Interval on difference", "Cohen's d (effect size)", "Statistical power"],
    toolkit: null,
  },
  leaf_ab_paired_t: {
    models: ["Paired t-test (scipy.stats.ttest_rel)", "Wilcoxon Signed-Rank Test (non-parametric paired)"],
    primary: "Paired t-test",
    notes: "Paired tests are more powerful than independent tests because they control for between-subject variability. Use when each subject appears in both conditions (e.g. user sees version A on Monday, version B on Tuesday). Wilcoxon signed-rank is the non-parametric alternative.",
    tip: "Compute the difference d_i = x_B_i - x_A_i for each pair. Then run a one-sample t-test on d against H0: mean(d)=0. scipy.stats.ttest_rel(a, b) does this automatically.",
    metrics: ["p-value", "Mean difference ± 95% CI", "Cohen's d on differences"],
    toolkit: null,
  },
  leaf_ab_nonparam: {
    models: ["Mann-Whitney U Test (independent, non-parametric)", "Wilcoxon Signed-Rank (paired, non-parametric)", "Permutation Test (most flexible)", "Kruskal-Wallis (k groups)"],
    primary: "Mann-Whitney U Test",
    notes: "Mann-Whitney U tests whether values from group A tend to be larger than group B — without assuming normality. It tests the distribution, not just the mean. Permutation tests are the gold standard: shuffle group labels 10,000 times to build the null distribution empirically.",
    tip: "Mann-Whitney reports the U statistic and p-value, but also compute the rank-biserial correlation r = 1 - (2U)/(n1×n2) as effect size. r=0.1 small, r=0.3 medium, r=0.5 large. scipy.stats.mannwhitneyu(x, y, alternative='two-sided').",
    metrics: ["p-value", "Rank-biserial correlation r (effect size)", "Median difference + bootstrapped CI"],
    toolkit: null,
  },
  leaf_ab_proportion_freq: {
    models: ["Two-proportion Z-test", "Chi-squared Test of Independence", "Fisher's Exact Test (small samples < 5 expected in any cell)"],
    primary: "Two-proportion Z-test",
    notes: "For comparing conversion rates (clicks, purchases, sign-ups). Two-proportion Z-test is the standard. Chi-squared tests independence in a 2×2 contingency table — equivalent for large samples. Fisher's Exact Test is required when any expected cell count < 5.",
    tip: "Relative lift is often more useful than absolute difference. Lift = (p_B - p_A) / p_A. A change from 2% to 2.5% is a 25% relative lift even though the absolute difference is only 0.5pp. Always report both. Use statsmodels proportions_ztest(count, nobs).",
    metrics: ["p-value", "Absolute difference in proportions", "Relative lift (%)", "95% CI on difference", "Minimum Detectable Effect (MDE)"],
    toolkit: null,
  },
  leaf_ab_proportion_bayes: {
    models: ["Bayesian A/B Test (Beta-Binomial model)", "Thompson Sampling (sequential / multi-armed bandit)", "Pymc3 / NumPyro Bayesian model"],
    primary: "Beta-Binomial Bayesian A/B",
    notes: "Bayesian A/B gives the probability that variant B is better than A — more intuitive than p-values. Uses Beta distribution as conjugate prior for conversion rates. Thompson Sampling extends this to multi-armed bandits: allocate traffic dynamically based on current posterior — no fixed sample size needed.",
    tip: "Prior: Beta(1,1) = uniform (no prior belief). Posterior: Beta(α + conversions, β + non-conversions). P(B > A) = integral of P(p_B > p_A) over the joint posterior — estimate via Monte Carlo: np.mean(np.random.beta(a_B, b_B, 100000) > np.random.beta(a_A, b_A, 100000)).",
    metrics: ["P(B > A)", "Expected loss from choosing wrong variant", "Credible interval on difference", "Posterior distributions"],
    toolkit: null,
  },
  leaf_ab_anova: {
    models: ["One-Way ANOVA (parametric)", "Kruskal-Wallis Test (non-parametric)", "Tukey HSD Post-hoc Test (pairwise comparisons)", "Bonferroni Correction (multiple testing)"],
    primary: "One-Way ANOVA → Tukey HSD",
    notes: "ANOVA tests whether any group mean differs significantly across 3+ groups. It only tells you THAT a difference exists, not WHERE. Follow with Tukey HSD for all pairwise comparisons with family-wise error control. Kruskal-Wallis is the non-parametric equivalent.",
    tip: "ANOVA assumes: (1) normality within groups, (2) equal variances (Levene's test), (3) independence. Violating equal variances? Use Welch's ANOVA. Multiple comparisons without correction massively inflates Type I error: with 10 pairwise tests at α=0.05, expected false positives = 0.4. Always correct.",
    metrics: ["F-statistic", "p-value", "η² (effect size — variance explained)", "Pairwise comparison table with adjusted p-values"],
    toolkit: null,
  },
  leaf_ab_ml_compare: {
    models: ["5×2 CV Paired t-test (Dietterich)", "DeLong Test (AUC comparison)", "McNemar's Test (classification error comparison)", "Wilcoxon Signed-Rank on CV fold scores"],
    primary: "Wilcoxon Signed-Rank on CV fold AUC scores",
    notes: "Comparing ML models requires accounting for the dependence introduced by using the same data. The 5×2 CV paired t-test (Dietterich 1998) is the theoretically sound approach: run 5 repetitions of 2-fold CV, compute differences on matched folds. DeLong test compares AUC-ROC curves directly with a paired structure. McNemar's test compares which model makes fewer errors on the same test set.",
    tip: "Simple practical approach: run 10-fold stratified CV for both models, collect fold-level AUC scores, run scipy.stats.wilcoxon(scores_A, scores_B). If p < 0.05, the difference is statistically significant. Report mean ± std AUC for both models.",
    metrics: ["p-value of model comparison", "Mean AUC difference ± CI", "Effect size (Cohen's d on fold scores)"],
    toolkit: "Your DS Toolkit Notebook 06 — test set model comparison table",
  },
  leaf_ab_uplift: {
    models: ["S-Learner (single model with treatment indicator)", "T-Learner (separate models per treatment arm)", "X-Learner (cross-fitted CATE estimation)", "Causal Forest (Wager & Athey)", "DoWhy + CausalML (full causal pipeline)"],
    primary: "T-Learner → Causal Forest",
    notes: "Uplift modeling estimates the Conditional Average Treatment Effect (CATE) — the individual-level causal effect of a treatment. A/B test tells you the average effect; uplift modeling tells you WHO benefits most. T-Learner: fit separate model on control group and treatment group; CATE = μ_treatment(x) - μ_control(x). Causal Forest uses random forests to estimate heterogeneous treatment effects.",
    tip: "Causal Forest (from EconML or grf R package) provides honest CATE estimates with valid confidence intervals. Key assumption: unconfoundedness — treatment assignment is independent of potential outcomes conditional on observed covariates. Always check overlap (common support) between treatment and control groups.",
    metrics: ["AUUC (Area Under Uplift Curve)", "Qini coefficient", "CATE distribution", "Calibration of CATE estimates"],
    toolkit: null,
  },
  leaf_ab_power: {
    models: ["statsmodels.stats.power (TTestIndPower, NormalIndPower)", "G*Power (external tool)", "Simulation-based power analysis"],
    primary: "statsmodels TTestIndPower or NormalIndPower",
    notes: "Power analysis determines the sample size needed to detect an effect of a given size with desired confidence. Four linked quantities: sample size n, effect size d, significance level α, power (1-β). Fix three to solve for the fourth. Convention: α=0.05, power=0.80. Increase to power=0.90 for high-stakes decisions.",
    tip: "Python recipe: from statsmodels.stats.power import TTestIndPower; analysis = TTestIndPower(); n = analysis.solve_power(effect_size=0.2, alpha=0.05, power=0.80). For proportions use NormalIndPower. Rule of thumb: detecting a 1pp lift on a 2% baseline (50% relative lift) needs ~5,000 users per arm at 80% power.",
    metrics: ["Required n per group", "Minimum Detectable Effect at given n", "Power curve (power vs n)", "Expected experiment duration"],
    toolkit: null,
  },

  // ═══════════════════════════════════════════════════════
  // MODEL EVALUATION & INTERPRETABILITY
  // ═══════════════════════════════════════════════════════
  eval_task_type: {
    question: "What type of model are you evaluating or interpreting?",
    options: [
      { label: "Binary classifier  (default / fraud / churn detection)", icon: "◐", next: "eval_binary_type" },
      { label: "Multiclass classifier", icon: "◉", next: "leaf_eval_multiclass" },
      { label: "Regression model", icon: "∿", next: "leaf_eval_regression" },
      { label: "Explain why a model makes predictions  (interpretability)", icon: "🔬", next: "eval_interp_scope" },
      { label: "Clustering model", icon: "◎", next: "leaf_eval_clustering" },
    ],
  },
  eval_binary_type: {
    question: "What aspect of binary classifier performance do you want to evaluate?",
    options: [
      { label: "Discrimination power  (how well does it rank / separate?)", icon: "◑", next: "leaf_eval_binary_discrim" },
      { label: "Decision threshold & business trade-offs", icon: "⚖", next: "leaf_eval_binary_threshold" },
      { label: "Calibration  (are predicted probabilities reliable?)", icon: "∿", next: "leaf_eval_binary_calibration" },
      { label: "Business impact & expected value", icon: "£", next: "leaf_eval_binary_business" },
    ],
  },
  eval_interp_scope: {
    question: "What level of explanation do you need?",
    options: [
      { label: "Global — overall feature importance across all predictions", icon: "◎", next: "eval_interp_global_type" },
      { label: "Local — explain one specific prediction", icon: "·", next: "leaf_eval_local_interp" },
      { label: "Partial dependence — how does one feature affect the output?", icon: "⟋", next: "leaf_eval_pdp" },
    ],
  },
  eval_interp_global_type: {
    question: "What kind of model is it?",
    options: [
      { label: "Tree-based  (Random Forest, LightGBM, XGBoost, GBM)", icon: "🌿", next: "leaf_eval_global_tree" },
      { label: "Any model type  (model-agnostic)", icon: "◈", next: "leaf_eval_global_agnostic" },
    ],
  },

  // ── Evaluation Leaves ──────────────────────────────────
  leaf_eval_binary_discrim: {
    models: ["AUC-ROC", "Gini Coefficient", "KS Statistic", "Gains & Lift Table", "Top-Decile Capture"],
    primary: "AUC-ROC → Gini → KS → Gains Table",
    notes: "Discrimination measures how well the model separates positives from negatives — regardless of threshold. AUC-ROC is the area under the Receiver Operating Characteristic curve (0.5 = random, 1.0 = perfect). Gini = 2×AUC - 1 (industry standard in credit scoring). KS Statistic = max separation between the positive and negative CDFs at any threshold — widely used in banking regulation. The Gains Table shows cumulative positive capture rate by score decile — essential for operational planning.",
    tip: "Full discrimination recipe: (1) Compute AUC-ROC with sklearn.metrics.roc_auc_score. (2) Gini = 2×AUC − 1. (3) KS = max(TPR − FPR) from the ROC curve. (4) Build gains table: sort by predicted score descending, bin into 10 deciles, compute cum_positives/total_positives per decile. Top-decile capture > 50% is the common credit risk benchmark.",
    metrics: ["AUC-ROC (> 0.78 credit risk benchmark)", "Gini Coefficient (> 0.55 credit risk benchmark)", "KS Statistic (> 0.35 credit risk benchmark)", "Top-decile capture (> 50% credit risk benchmark)"],
    toolkit: "Notebook 06 in your DS Toolkit — full Section 7 evaluation suite",
  },
  leaf_eval_binary_threshold: {
    models: ["Precision-Recall Curve", "F1 vs Threshold curve", "Cost-sensitive threshold optimisation", "Confusion Matrix at chosen threshold"],
    primary: "Precision-Recall curve + optimal F1 threshold",
    notes: "The default threshold of 0.5 is almost never optimal for imbalanced or cost-sensitive problems. Threshold choice depends on your business cost ratio: FP cost vs FN cost. For fraud detection, FN (missed fraud) costs far more than FP (false alarm). For marketing uplift, FP (wasted outreach) may cost more.",
    tip: "Threshold optimisation recipe: (1) Compute precision, recall, F1 across thresholds 0.01–0.99. (2) For symmetric cost: pick threshold that maximises F1. (3) For asymmetric cost: define cost_matrix = [[0, FP_cost],[FN_cost, 0]], minimise expected cost. (4) For credit/collections: fix recall at 80%, maximise precision. sklearn: precision_recall_curve(y_true, y_proba) returns arrays at all thresholds.",
    metrics: ["Precision @ chosen threshold", "Recall @ chosen threshold", "F1 @ chosen threshold", "False Positive Rate", "Expected cost at threshold"],
    toolkit: "Notebook 06 Section 7.2 — threshold analysis cells",
  },
  leaf_eval_binary_calibration: {
    models: ["Calibration Curve (Reliability Diagram)", "Brier Score", "Expected Calibration Error (ECE)", "Platt Scaling (post-hoc calibration)", "Isotonic Regression (post-hoc calibration)"],
    primary: "Calibration Curve + Brier Score",
    notes: "A calibrated model means: when it predicts 70% probability, the actual event rate is ~70%. Uncalibrated models are dangerous in credit/medical contexts where raw probability matters. Brier Score = mean((predicted_prob - actual)²). Lower is better; no-skill baseline = base_rate × (1 - base_rate). Brier Skill Score = 1 - Brier/Brier_baseline.",
    tip: "Calibration curve recipe: sklearn.calibration.calibration_curve(y_true, y_proba, n_bins=10). Plot fraction_of_positives vs mean_predicted_value. Perfect calibration = diagonal line. If curve is S-shaped (overconfident): use Platt Scaling (LogisticRegression on raw scores). If curve is concave: use Isotonic Regression. Apply calibration on a held-out validation set.",
    metrics: ["Brier Score (lower = better)", "Brier Skill Score (1 = perfect, 0 = no skill)", "ECE (Expected Calibration Error)", "Max Calibration Error"],
    toolkit: "Notebook 06 Section 7.5 — calibration cells",
  },
  leaf_eval_binary_business: {
    models: ["Success Criteria Scorecard", "Expected Loss Reduction Estimate", "Cost-Benefit Matrix", "Net Benefit Curve (Decision Curve Analysis)"],
    primary: "Success Criteria Scorecard → Expected Loss Reduction",
    notes: "Business impact framing translates statistical metrics into financial / operational value. Success Criteria Scorecard: define thresholds for each metric (AUC > 0.78, Gini > 0.55, KS > 0.35, top-decile > 50%) and score PASS/FAIL. Expected Loss Reduction: (TP × avg_exposure × LGD) - (FP × avg_exposure × NIM_rate). Quantifies net benefit of deploying the model vs baseline (no model).",
    tip: "Expected Loss formula: Prevented_Loss = TP × avg_loan × LGD. Foregone_Revenue = FP × avg_loan × NIM. Net_Benefit = Prevented_Loss - Foregone_Revenue. LGD (Loss Given Default) ≈ 0.60 for unsecured consumer lending. NIM (Net Interest Margin) ≈ 0.05. These assumptions should be validated with your finance team.",
    metrics: ["PASS/FAIL per criterion", "Net financial benefit £/$", "Loss prevention rate vs baseline", "Foregone revenue estimate"],
    toolkit: "Notebook 06 Section 9 — full business impact cells",
  },
  leaf_eval_multiclass: {
    models: ["Macro F1", "Weighted F1", "Per-class Precision & Recall", "Confusion Matrix (heatmap)", "Top-k Accuracy"],
    primary: "Weighted F1 + confusion matrix",
    notes: "Multiclass evaluation requires looking beyond overall accuracy. Macro F1 treats all classes equally (good when classes are balanced and all matter equally). Weighted F1 weights by class support (good for imbalanced classes). Always inspect the confusion matrix heatmap — it reveals which classes confuse the model systematically.",
    tip: "Confusion matrix insight: off-diagonal cells show systematic confusions. If class 3 is often predicted as class 1, those classes may share features. Consider: (1) adding discriminative features, (2) merging the classes if the distinction isn't meaningful, (3) hierarchical classification. sklearn.metrics.classification_report gives per-class precision, recall, F1, support in one call.",
    metrics: ["Macro F1", "Weighted F1", "Per-class F1", "Confusion matrix", "Accuracy"],
    toolkit: null,
  },
  leaf_eval_regression: {
    models: ["RMSE (Root Mean Squared Error)", "MAE (Mean Absolute Error)", "MAPE (Mean Absolute Percentage Error)", "R² (Coefficient of Determination)", "Residual Analysis"],
    primary: "RMSE + residual plots",
    notes: "RMSE penalises large errors more than MAE (due to squaring) — use RMSE when large errors are especially costly. MAE is more robust to outliers. MAPE is unit-free (percentage error) but breaks when true values are zero. R² measures proportion of variance explained — but can be misleading: a model with high R² can still have bad residuals.",
    tip: "Always plot residuals: (1) Residuals vs Fitted: should be random noise — any pattern = model misspecification. (2) Q-Q plot: should be diagonal — deviations = non-normal errors. (3) Scale-Location: should be flat — funnel shape = heteroscedasticity (fix: log transform target). (4) Residuals vs Leverage: identifies high-influence points.",
    metrics: ["RMSE", "MAE", "MAPE (if no zeros in target)", "R²", "Residual normality (Shapiro-Wilk)", "Heteroscedasticity (Breusch-Pagan)"],
    toolkit: null,
  },
  leaf_eval_global_tree: {
    models: ["Native Gain Importance (LightGBM / XGBoost)", "Split Count Importance", "Cover Importance", "Permutation Importance (model-agnostic)", "SHAP Global Bar Plot", "Interpretability Triangulation Table"],
    primary: "SHAP bar + Permutation Importance (triangulate with Gain)",
    notes: "Tree models have three native importance types: Gain (avg loss reduction per split — most informative), Split Count (how often a feature is used), Cover (avg data coverage per split). These can disagree. Gain can overstate high-cardinality features. Permutation importance (drop-column equivalent) is model-agnostic and directly measures impact on validation AUC. SHAP is the gold standard: grounded in game theory, consistent, and enables both global and local explanations.",
    tip: "Triangulation recipe: (1) Compute Gain rank, Permutation rank, SHAP rank for each feature. (2) Build a table with all three ranks. (3) Compute average rank. (4) Features that rank highly on ALL three methods are your genuinely important features. Features that rank high on only one method may be artefacts. Use this table to justify feature selection decisions to stakeholders.",
    metrics: ["Feature rank consistency across methods", "Top-N feature agreement", "Drop-in AUC when feature removed"],
    toolkit: "Notebook 07 Section 8 — gain/split, permutation, SHAP triangulation",
  },
  leaf_eval_global_agnostic: {
    models: ["Permutation Importance (sklearn)", "SHAP KernelExplainer (any model)", "SHAP TreeExplainer (tree models only — fast)", "LOFO (Leave One Feature Out) Importance", "Partial Dependence Plots (aggregate)"],
    primary: "Permutation Importance → SHAP",
    notes: "Permutation Importance: randomly shuffle each feature, measure AUC drop — the bigger the drop, the more important the feature. Fast and reliable. SHAP KernelExplainer works for ANY model (linear, SVM, neural net) but is slow (O(n × features) per explanation). For tree models, always use SHAP TreeExplainer — exact and fast. LOFO: iteratively retrain model without each feature — most accurate but very slow.",
    tip: "SHAP KernelExplainer recipe: background = shap.kmeans(X_train, 50) — use 50 representative background samples to approximate the expectation. Then explainer = shap.KernelExplainer(model.predict_proba, background); shap_values = explainer.shap_values(X_test_sample). Use a sample of 100–500 rows — KernelExplainer is slow.",
    metrics: ["AUC drop per feature (permutation)", "Mean |SHAP| per feature", "Feature rank stability across CV folds"],
    toolkit: "Notebook 07 Sections 8.2 and 8.3",
  },
  leaf_eval_local_interp: {
    models: ["SHAP Waterfall Plot (single prediction)", "SHAP Force Plot", "LIME (Local Interpretable Model-agnostic Explanations)", "SHAP Scatter Plot (feature × SHAP value)", "Counterfactual Explanations (DiCE)"],
    primary: "SHAP Waterfall Plot",
    notes: "Local explanations answer: 'why did the model make THIS prediction for THIS person?' SHAP Waterfall: shows each feature's positive/negative contribution to the final prediction, starting from the base value (average prediction). LIME fits a local linear model around the prediction point. DiCE generates counterfactuals: 'what would need to change for the outcome to flip?' — powerful for credit decisioning.",
    tip: "SHAP Waterfall recipe: explainer = shap.TreeExplainer(model); sv = explainer(X_sample); shap.plots.waterfall(sv[idx]). For credit risk: show waterfall to applicants as their 'reason codes'. The top 3 negative SHAP features are the primary adverse action reasons — regulatory requirement in many jurisdictions (ECOA, GDPR).",
    metrics: ["Feature-level SHAP values for the prediction", "Predicted probability", "Top contributing features (positive and negative)"],
    toolkit: "Notebook 07 Section 8.6 — waterfall plots for high/low/borderline cases",
  },
  leaf_eval_pdp: {
    models: ["Partial Dependence Plot (PDP) — marginal effect of one feature", "Individual Conditional Expectation (ICE) — per-sample lines", "2D PDP (feature interaction)", "SHAP Dependence Plot (SHAP value vs feature value)"],
    primary: "PDP + ICE overlay",
    notes: "PDP shows the average marginal effect of a feature on the prediction, holding all others constant. ICE plots show the same relationship for EACH individual row — reveals heterogeneity that PDP averages away. If ICE lines all run parallel to the PDP mean, there is no interaction. If they cross or fan out, there are interactions. SHAP Dependence Plot adds a second feature (auto-selected) to reveal interaction effects via coloring.",
    tip: "ICE + PDP recipe: sklearn.inspection.PartialDependenceDisplay.from_estimator(pipeline, X_val, features=['feature_name'], kind='both') — 'both' overlays ICE (light) and PDP (bold). For SHAP dependence: shap.plots.scatter(shap_values[:, 'feature_name'], color=shap_values). The vertical spread at any x-value represents interaction effects.",
    metrics: ["PDP slope / shape (linear? threshold? non-monotone?)", "ICE line variance (low = no interaction, high = interaction exists)", "SHAP interaction value magnitude"],
    toolkit: "Notebook 07 Section 8.7 — PDP for top-4 SHAP features",
  },
  leaf_eval_clustering: {
    models: ["Silhouette Score", "Davies-Bouldin Index", "Calinski-Harabasz Index", "Inertia / Elbow Method", "Dendrogram cut-level analysis", "Visual inspection via UMAP/t-SNE projection"],
    primary: "Silhouette Score + visual UMAP projection",
    notes: "Clustering validation is inherently harder than supervised evaluation — there is no ground truth. Silhouette Score: measures how similar a point is to its own cluster vs other clusters (-1 to +1; higher = better). Davies-Bouldin: ratio of within-cluster scatter to between-cluster separation (lower = better). Inertia (K-Means): total within-cluster sum of squares — use elbow method to pick k.",
    tip: "Practical validation recipe: (1) Plot Silhouette Score vs k (k=2..15). (2) Plot Inertia vs k — look for the elbow. (3) Project data to 2D with UMAP, colour by cluster label — do the colours form visually coherent groups? (4) Sample 5 items from each cluster and manually inspect — do they 'make sense' together? Human validation is irreplaceable for clustering.",
    metrics: ["Silhouette Score (higher = better, range -1 to 1)", "Davies-Bouldin Index (lower = better)", "Calinski-Harabasz Index (higher = better)", "Visual separation in UMAP/t-SNE projection"],
    toolkit: null,
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY METADATA (for root display)
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  SUPERVISED:        { bg: "#0f2a1e", border: "#1e6644", text: "#4fffb0" },
  UNSUPERVISED:      { bg: "#1a1500", border: "#5a4500", text: "#ffd166" },
  "DEEP LEARNING":   { bg: "#0f1a2e", border: "#1e3d6e", text: "#60a5fa" },
  REINFORCEMENT:     { bg: "#1a0f2e", border: "#4a1e8e", text: "#c084fc" },
  SEQUENTIAL:        { bg: "#1a100f", border: "#6e2e1e", text: "#fb923c" },
  "SEMI-SUPERVISED": { bg: "#0f1a1a", border: "#1e5a5a", text: "#34d399" },
  STATS:             { bg: "#1a0f18", border: "#6e1e5e", text: "#f472b6" },
  EVALUATION:        { bg: "#1a1510", border: "#6e4e1e", text: "#fb923c" },
  STATS:             { bg: "#1a0f18", border: "#6e1e5a", text: "#f472b6" },
  EVALUATION:        { bg: "#101a10", border: "#2e5a2e", text: "#86efac" },
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#080b10",
  surface:  "#0e1118",
  card:     "#131720",
  border:   "#1e2433",
  accent:   "#4fffb0",
  accentDim:"#0d2e1e",
  gold:     "#ffd166",
  goldDim:  "#2a2000",
  blue:     "#60a5fa",
  blueDim:  "#0a1628",
  purple:   "#c084fc",
  purpleDim:"#1a0f2e",
  text:     "#dce4f0",
  muted:    "#5a6480",
  sub:      "#8a94b0",
};

const baseBtn = {
  background: C.card,
  border: `1px solid ${C.border}`,
  color: C.text,
  padding: "16px 22px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 14,
  transition: "border-color 0.12s, background 0.12s",
  width: "100%",
  lineHeight: 1.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ModelNavigator() {
  const [path, setPath] = useState(["root"]);
  const [hovered, setHovered] = useState(null);

  const currentId   = path[path.length - 1];
  const currentNode = TREE[currentId];
  const isLeaf      = !!currentNode?.models;
  const isRoot      = currentId === "root";

  const choose  = (nextId) => { setPath([...path, nextId]); setHovered(null); };
  const goBack  = () => setPath(path.slice(0, -1));
  const restart = () => { setPath(["root"]); setHovered(null); };
  const goTo    = (idx) => { setPath(path.slice(0, idx + 1)); setHovered(null); };

  const depthLabel = isRoot ? "START" : isLeaf ? "RESULT" : `STEP ${path.length - 1}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    }}>
      {/* ── HEADER ───────────────────────────────────────── */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "18px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            background: C.accentDim,
            border: `1px solid ${C.accent}`,
            padding: "3px 10px",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: C.accent,
            fontWeight: 700,
          }}>DS TOOLKIT</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: C.text }}>
              Model Selection Navigator
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              v3 — + A/B testing, evaluation & interpretability
            </div>
          </div>
        </div>
        <button onClick={restart} style={{
          background: "transparent",
          border: `1px solid ${C.border}`,
          color: C.muted,
          padding: "7px 14px",
          cursor: "pointer",
          fontSize: 11,
          letterSpacing: "0.1em",
          fontFamily: "inherit",
        }}>↺ RESTART</button>
      </div>

      {/* ── BREADCRUMB ──────────────────────────────────── */}
      {!isRoot && (
        <div style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "10px 28px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 4,
          fontSize: 11,
          color: C.muted,
        }}>
          {path.map((id, idx) => {
            const node = TREE[id];
            const label = idx === 0 ? "Task Type" :
              node?.models ? "⊛ Result" :
              (node?.question || "").split(" ").slice(0,4).join(" ") + "…";
            const isLast = idx === path.length - 1;
            return (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {idx > 0 && <span style={{ color: C.border, fontSize: 13 }}>›</span>}
                <span onClick={() => !isLast && goTo(idx)} style={{
                  color: isLast ? C.accent : C.sub,
                  cursor: isLast ? "default" : "pointer",
                  textDecoration: isLast ? "none" : "underline",
                  textUnderlineOffset: 2,
                }}>{label}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* ── MAIN ──────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 28px 60px" }}>

        {/* Depth badge */}
        <div style={{
          fontSize: 10, letterSpacing: "0.2em", color: C.muted,
          marginBottom: 14, fontWeight: 700,
        }}>{depthLabel}</div>

        {/* Question */}
        <h2 style={{
          margin: "0 0 6px", fontSize: isRoot ? 28 : 23,
          fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em",
          color: C.text, fontFamily: "inherit",
        }}>{currentNode?.question}</h2>

        {currentNode?.subtitle && (
          <p style={{ margin: "0 0 28px", color: C.sub, fontSize: 13, lineHeight: 1.7 }}>
            {currentNode.subtitle}
          </p>
        )}
        {!currentNode?.subtitle && <div style={{ height: 24 }} />}

        {/* ── QUESTION NODE ─────────────────────────────── */}
        {!isLeaf && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentNode.options.map((opt, i) => {
                const catStyle = opt.tag ? CATEGORY_COLORS[opt.tag] : null;
                const isHov = hovered === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(opt.next)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      ...baseBtn,
                      background: isHov ? (catStyle ? catStyle.bg : "#181e2c") : C.card,
                      borderColor: isHov ? (catStyle ? catStyle.border : C.accent) : C.border,
                    }}
                  >
                    {/* Icon */}
                    <span style={{
                      fontSize: 18, minWidth: 26, textAlign: "center",
                      color: catStyle ? catStyle.text : C.accent,
                      opacity: 0.9,
                    }}>{opt.icon}</span>

                    {/* Label + tag */}
                    <span style={{ flex: 1 }}>
                      <span style={{ color: C.text }}>{opt.label}</span>
                      {opt.tag && (
                        <span style={{
                          marginLeft: 10, fontSize: 9, letterSpacing: "0.15em",
                          fontWeight: 700, padding: "2px 7px",
                          background: catStyle.bg, border: `1px solid ${catStyle.border}`,
                          color: catStyle.text, verticalAlign: "middle",
                        }}>{opt.tag}</span>
                      )}
                    </span>
                    <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                  </button>
                );
              })}
            </div>

            {!isRoot && (
              <button onClick={goBack} style={{
                marginTop: 20, background: "transparent", border: "none",
                color: C.muted, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, padding: 0, letterSpacing: "0.05em",
              }}>← Back</button>
            )}
          </>
        )}

        {/* ── LEAF / RESULT NODE ────────────────────────── */}
        {isLeaf && (
          <>
            {/* Primary recommendation */}
            <div style={{
              background: C.accentDim,
              border: `1px solid ${C.accent}`,
              padding: "20px 24px",
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.2em", color: C.accent,
                textTransform: "uppercase", marginBottom: 7, fontWeight: 700,
              }}>★  Start With</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: "-0.01em" }}>
                {currentNode.primary}
              </div>
            </div>

            {/* Model list */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              padding: "20px 24px", marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.2em", color: C.muted,
                textTransform: "uppercase", marginBottom: 14, fontWeight: 700,
              }}>Full Candidate List  (run in order)</div>
              {currentNode.models.map((m, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "9px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.muted, fontSize: 11, minWidth: 22, paddingTop: 1 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{m}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              padding: "20px 24px", marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.2em", color: C.muted,
                textTransform: "uppercase", marginBottom: 12, fontWeight: 700,
              }}>Context & Rationale</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: C.sub }}>
                {currentNode.notes}
              </p>
            </div>

            {/* Pro Tip */}
            <div style={{
              background: C.goldDim, border: `1px solid ${C.gold}`,
              padding: "16px 22px", marginBottom: 12,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, color: C.gold, marginTop: 2 }}>⚡</span>
              <div>
                <div style={{
                  fontSize: 10, letterSpacing: "0.2em", color: C.gold,
                  textTransform: "uppercase", marginBottom: 6, fontWeight: 700,
                }}>Pro Tip</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "#c8a84a" }}>
                  {currentNode.tip}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              padding: "18px 24px", marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.2em", color: C.muted,
                textTransform: "uppercase", marginBottom: 12, fontWeight: 700,
              }}>Evaluate With</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentNode.metrics.map((m, i) => (
                  <span key={i} style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    padding: "5px 11px", fontSize: 12, color: C.sub, letterSpacing: "0.02em",
                  }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Toolkit callout */}
            {currentNode.toolkit && (
              <div style={{
                background: C.blueDim, border: `1px solid ${C.blue}`,
                padding: "14px 20px", marginBottom: 12,
                display: "flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ color: C.blue, fontSize: 14 }}>📓</span>
                <div>
                  <span style={{ fontSize: 10, color: C.blue, letterSpacing: "0.15em", fontWeight: 700, marginRight: 8 }}>
                    DS TOOLKIT
                  </span>
                  <span style={{ fontSize: 12, color: "#7ab8f5" }}>{currentNode.toolkit}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={goBack} style={{
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.muted, padding: "11px 18px", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, letterSpacing: "0.05em",
              }}>← Back</button>
              <button onClick={restart} style={{
                background: C.accentDim, border: `1px solid ${C.accent}`,
                color: C.accent, padding: "11px 22px", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, letterSpacing: "0.12em", fontWeight: 700,
              }}>↺  NEW QUERY</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
