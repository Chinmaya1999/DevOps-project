const TerraformTemplate = require('../models/TerraformTemplate');

// Get all terraform templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await TerraformTemplate.find({ isActive: true })
      .sort({ lastUpdated: -1 });
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching terraform templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terraform templates'
    });
  }
};

// Get terraform template by ID
const getTemplateById = async (req, res) => {
  try {
    const template = await TerraformTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Terraform template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching terraform template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terraform template'
    });
  }
};

// Create new terraform template
const createTemplate = async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      author: req.user?.name || 'Admin'
    };
    
    const template = new TerraformTemplate(templateData);
    await template.save();
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Terraform template created successfully'
    });
  } catch (error) {
    console.error('Error creating terraform template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create terraform template'
    });
  }
};

// Update terraform template
const updateTemplate = async (req, res) => {
  try {
    const template = await TerraformTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Terraform template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template,
      message: 'Terraform template updated successfully'
    });
  } catch (error) {
    console.error('Error updating terraform template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update terraform template'
    });
  }
};

// Delete terraform template
const deleteTemplate = async (req, res) => {
  try {
    const template = await TerraformTemplate.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Terraform template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Terraform template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting terraform template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete terraform template'
    });
  }
};

// Get terraform template categories
const getCategories = async (req, res) => {
  try {
    const categories = await TerraformTemplate.distinct('category');
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Get terraform template providers
const getProviders = async (req, res) => {
  try {
    const providers = await TerraformTemplate.distinct('provider');
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers'
    });
  }
};

// Get admin dashboard stats for terraform templates
const getDashboardStats = async (req, res) => {
  try {
    const totalTemplates = await TerraformTemplate.countDocuments();
    const activeTemplates = await TerraformTemplate.countDocuments({ isActive: true });
    const totalCategories = await TerraformTemplate.distinct('category').then(cats => cats.length);
    const totalProviders = await TerraformTemplate.distinct('provider').then(provs => provs.length);
    
    const recentUpdates = await TerraformTemplate.find({ isActive: true })
      .sort({ lastUpdated: -1 })
      .limit(5)
      .select('subjectName description lastUpdated');
    
    res.status(200).json({
      success: true,
      data: {
        totalTemplates,
        activeTemplates,
        totalCategories,
        totalProviders,
        recentUpdates
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  getProviders,
  getDashboardStats
};
