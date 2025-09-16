import React from 'react';
import { BriefcaseIcon, EnvelopeIcon, LinkIcon } from '@heroicons/react/24/outline';

const CreativeTeamSection: React.FC = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Đặng Thùy Dương',
      role: 'NGƯỜI ĐẠI DIỆN',
      description: 'Chuyên gia chiến lược với tầm nhìn phát triển bền vững',
      skills: ['Chiến lược', 'Phát triển bền vững', 'Quản lý dự án'],
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Nguyễn Thị Bích Mùi',
      role: 'CHIEF MARKETING OFFICER',
      description: 'Chuyên gia marketing với 5+ năm kinh nghiệm trong ngành thời trang',
      skills: ['Digital Marketing', 'Brand Strategy', 'Consumer Insights'],
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Phạm Ngọc Hương Quỳnh',
      role: 'CHIEF EXECUTIVE OFFICER',
      description: 'Nhà lãnh đạo tầm nhìn với passion về môi trường và đổi mới',
      skills: ['Leadership', 'Business Strategy', 'Sustainability'],
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Ngô Trần Anh Phú',
      role: 'CHIEF TECHNOLOGY OFFICER',
      description: 'Kỹ sư công nghệ với chuyên môn về platform và development',
      skills: ['Full-stack Development', 'System Architecture', 'Innovation'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    },
    {
      id: 5,
      name: 'Lê Bảo Duy',
      role: 'CHIEF OPERATING OFFICER',
      description: 'Chuyên gia vận hành với kinh nghiệm tối ưu quy trình sản xuất',
      skills: ['Operations', 'Supply Chain', 'Quality Control'],
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    },
    {
      id: 6,
      name: 'Nguyễn Văn Cường',
      role: 'CHIEF BUSINESS DEVELOPMENT OFFICER',
      description: 'Chuyên gia phát triển kinh doanh và mở rộng thị trường',
      skills: ['Business Development', 'Partnership', 'Market Expansion'],
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      status: 'Active'
    }
  ];

  return (
    <section className="w-full bg-gradient-to-b from-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700">
            Đội ngũ lãnh đạo 
          </h2>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              {/* Profile Image */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 font-medium">{member.status}</span>
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-green-700 text-center mb-2">
                {member.name}
              </h3>

              {/* Role */}
              <p className="text-sm text-gray-600 text-center mb-3 font-medium">
                {member.role}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
                {member.description}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {member.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Contact Icons */}
              <div className="flex justify-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <BriefcaseIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <EnvelopeIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <LinkIcon className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreativeTeamSection;
